import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Filter, Calendar, FileText, BarChart3, Package, Users, ShoppingCart } from 'lucide-react';
import adminAxios from '../utils/adminAxios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    status: '',
    customerId: '',
    stockLevel: ''
  });
  const tableRef = useRef(null);
  const formatCellValue = (value, header) => {
    if (value === null || value === undefined) return '';

    // Handle long text fields specially
    if (header.toLowerCase().includes('description') && typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }

    if (header.toLowerCase().includes('embedding') && Array.isArray(value)) {
      return `[${value.length} values]`;
    }

    if (header.toLowerCase().includes('embedding') && typeof value === 'object') {
      return '[Embedding data]';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  };

  const formatPDFCellValue = (value, header) => {
    if (value === null || value === undefined) return '';

    // For PDF, truncate even more aggressively
    if (header.toLowerCase().includes('description') && typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }

    if (header.toLowerCase().includes('embedding') && Array.isArray(value)) {
      return `[${value.length} values]`;
    }

    if (header.toLowerCase().includes('embedding') && typeof value === 'object') {
      return '[Embedding data]';
    }

    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    }

    return value;
  };

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'customers', label: 'Customer Report', icon: Users },
    { id: 'orders', label: 'Order Status', icon: ShoppingCart },
    { id: 'forecast', label: 'Sales Forecast', icon: TrendingUp }
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Map tab IDs to API endpoints
      const endpointMap = {
        'sales': 'sales',
        'inventory': 'inventory',
        'customers': 'customers',
        'orders': 'order-status',
        'forecast': 'forecast'
      };

      const endpoint = endpointMap[activeTab] || activeTab;
      const response = await adminAxios.get(`/report/${endpoint}?${params}`);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getFlattenedReportData = () => {
    if (activeTab === 'sales' && reportData.length > 0) {
      return reportData.map(item => ({
        date: item._id?.date || '',
        status: item._id?.status || '',
        totalRevenue: item.totalRevenue || 0,
        totalOrders: item.totalOrders || 0,
        totalBooks: item.totalBooks || 0
      }));
    }

    if (activeTab === 'forecast') {
      if (!reportData || !reportData.historical) return [];
      return reportData.historical.map(h => ({
         Month: h.label,
         TotalSales: h.totalSales,
         Type: 'Historical'
      })).concat(reportData.forecast ? [{
         Month: reportData.forecast.label,
         TotalSales: reportData.forecast.predictedSales,
         Type: 'Forecast'
      }] : []);
    }

    // Filter out unwanted fields for all other reports
    const filteredFields = ['image', 'embedding','description','createdAt', 'updatedAt', '__v'];
    return reportData.map(item => {
      const filteredItem = {};
      Object.keys(item).forEach(key => {
        if (!filteredFields.includes(key)) {
          filteredItem[key] = item[key];
        }
      });
      return filteredItem;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToCSV = () => {
    const flatData = getFlattenedReportData();
    if (flatData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = Object.keys(flatData[0]);
    const rows = flatData.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'object' ? JSON.stringify(value) : `${value ?? ''}`;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported to CSV');
  };

  const exportToExcel = () => {
    const flatData = getFlattenedReportData();
    if (flatData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
    XLSX.writeFile(workbook, `${activeTab}-report.xlsx`);
    toast.success('Report exported to Excel');
  };

  const exportToPDF = async () => {
    if (reportData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    try {
      toast.info('Generating PDF...');

      // Create a completely new report element with plain HTML and inline styles
      const flatData = getFlattenedReportData();
      const reportName = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
      const generatedDate = new Date();
      const generatedAt = generatedDate.toLocaleString();

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        width: auto;
        font-family: Arial, sans-serif;
        color: #111827;
        background-color: #ffffff;
        padding: 16px;
      `;

      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 16px;
        padding-bottom: 8px;
      `;

      const logo = document.createElement('div');
      logo.style.cssText = `
        display: inline-flex;
        align-items: center;
        font-size: 22px;
        font-weight: 700;
        color: #1d4ed8;
        letter-spacing: 1px;
      `;
      logo.textContent = '📚 BOOkstore';

      const reportMeta = document.createElement('div');
      reportMeta.style.cssText = `
        text-align: right;
        font-size: 12px;
        color: #6b7280;
      `;
      reportMeta.innerHTML = `<div style="font-weight: 700; font-size: 18px; color: #111827;">${reportName}</div><div>Generated: ${generatedAt}</div>`;

      headerDiv.appendChild(logo);
      headerDiv.appendChild(reportMeta);
      wrapper.appendChild(headerDiv);

      const newTable = document.createElement('table');
      const headers = Object.keys(flatData[0]);
      const numColumns = headers.length;

      // Calculate minimum width based on number of columns (assuming ~150px per column)
      const minTableWidth = Math.max(numColumns * 150, 800);

      newTable.style.cssText = `
        width: ${minTableWidth}px;
        min-width: ${minTableWidth}px;
        border-collapse: collapse;
        font-family: Arial, sans-serif;
        font-size: 12px;
        background-color: white;
        color: #374151;
        table-layout: fixed;
      `;

      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      headers.forEach(header => {
        const th = document.createElement('th');
        th.style.cssText = `
          background: linear-gradient(90deg, #1d4ed8, #2563eb);
          border: 1px solid #1e40af;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: ${100 / numColumns}%;
          box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.35);
        `;
        th.textContent = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      newTable.appendChild(thead);

      // Create table body
      const tbody = document.createElement('tbody');
      flatData.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = rowIndex % 2 === 0 ? '#f8fafc' : '#eff6ff';

        headers.forEach(header => {
          const td = document.createElement('td');
          td.style.cssText = `
            border: 1px solid #cbd5e1;
            padding: 8px;
            color: #0f172a;
            width: ${100 / numColumns}%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `;
          const value = row[header];
          td.textContent = formatPDFCellValue(value, header);
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      newTable.appendChild(tbody);

      wrapper.appendChild(newTable);

      // Temporarily add to body for html2canvas
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '-9999px';
      wrapper.style.maxWidth = 'none';
      wrapper.style.width = `${minTableWidth + 32}px`;
      document.body.appendChild(wrapper);

      // Force layout calculation
      wrapper.offsetHeight; // Trigger layout

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: minTableWidth + 32,
        height: wrapper.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Remove the temporary wrapper
      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // Margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`${activeTab}-report.pdf`);
      toast.success('Report exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for the selected filters
        </div>
      );
    }
    
    if (activeTab === 'forecast' && !reportData.historical) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for the selected filters
        </div>
      );
    }

    if (activeTab === 'forecast') {
      const { historical, forecast, message } = reportData;
      if (!historical || historical.length === 0) return <div className="text-center">No data.</div>;

      let labels = historical.map(d => d.label);
      let salesData = historical.map(d => d.totalSales);
      
      let forecastDataPoint = null;
      if (forecast) {
         labels.push(forecast.label + " (Predicted)");
         forecastDataPoint = forecast.predictedSales;
      }

      const chartData = {
        labels,
        datasets: [
          {
            label: 'Historical Sales (₹)',
            data: [...salesData, null],
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Forecast (₹)',
            data: [...Array(salesData.length - 1).fill(null), salesData[salesData.length - 1], forecastDataPoint],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderDash: [5, 5],
            tension: 0.3,
          }
        ],
      };

      return (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-8">
           <h3 className="text-xl font-bold mb-4 text-center">6-Month Sales Trend & Forecast</h3>
           {message && <div className="mb-4 text-orange-600 bg-orange-50 p-3 rounded-lg text-sm text-center">{message}</div>}
           <div className="bg-white p-4 rounded-xl border border-gray-100">
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
           </div>
           {forecast && (
             <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100 flex justify-between items-center shadow-sm">
               <div>
                  <h4 className="text-blue-800 font-bold text-lg text-left">Prediction for {forecast.label}</h4>
                  <p className="text-blue-600 text-sm mt-1 text-left">Based on Linear Regression from the last 6 months</p>
               </div>
               <div className="text-3xl font-black text-blue-700">
                  ₹{forecast.predictedSales}
               </div>
             </div>
           )}
        </div>
      );
    }

    const flattenedData = getFlattenedReportData();
    const headers = flattenedData.length > 0 ? Object.keys(flattenedData[0]) : [];

    return (
      <table ref={tableRef} className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {flattenedData.map((row, index) => (
            <tr key={index}>
              {headers.map(header => (
                <td key={header} className="px-6 py-4 text-sm text-gray-900">
                  {(header.toLowerCase().includes('description') || header.toLowerCase().includes('embedding')) && typeof row[header] !== 'number' ?
                    <div className="max-w-xs truncate" title={typeof row[header] === 'object' ? JSON.stringify(row[header]) : row[header]}>
                      {formatCellValue(row[header], header)}
                    </div> :
                    <div className="whitespace-nowrap">
                      {formatCellValue(row[header], header)}
                    </div>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderFilters = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {activeTab === 'sales' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  placeholder="Enter category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  placeholder="Enter category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
                <select
                  name="stockLevel"
                  value={filters.stockLevel}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="low">Low Stock</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and export detailed reports for your bookstore</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Export Buttons */}
      <div className="mb-6 flex justify-end space-x-2">
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </button>
        <button
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 capitalize">{activeTab} Report</h3>
        </div>
        <div className="p-6">
          <div className="w-full">
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;