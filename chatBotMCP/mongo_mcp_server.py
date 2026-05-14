import asyncio

from mcp.server.fastmcp import FastMCP
from pymongo import MongoClient
from config import *
from sentence_transformers import SentenceTransformer
from datetime import datetime, timedelta
from bson.objectid import ObjectId

mongo = MongoClient(MONGO_URI)
db = mongo[DB_NAME]

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

mcp = FastMCP("ebook-store-analytics-server")


################################
# BOOK CATALOG
################################

@mcp.tool()
def list_books():
    """Return all books"""

    return list(
        db.books.find(
            {},
            {
                "_id": 0,
                "title": 1,
                "author": 1,
                "category": 1,
                "price": 1,
                "rating": 1,
                "countInStock": 1
            }
        )
    )


@mcp.tool()
def books_under_price(max_price: int):
    """Return books cheaper than given price"""

    return list(
        db.books.find(
            {"price": {"$lte": max_price}},
            {"_id": 0}
        )
    )


################################
# USER ANALYTICS
################################

@mcp.tool()
def total_users():

    return {
        "users": db.users.count_documents({})
    }


################################
# ORDER ANALYTICS
################################

@mcp.tool()
def total_orders():

    return {
        "orders": db.orders.count_documents({})
    }


@mcp.tool()
def total_revenue():
    """Return total revenue"""

    pipeline = [
        {
            "$group": {
                "_id": None,
                "revenue": {"$sum": "$finalAmount"}
            }
        }
    ]

    result = list(db.orders.aggregate(pipeline))

    return result[0] if result else {"revenue": 0}


################################
# MONTHLY REVENUE
################################

@mcp.tool()
def monthly_revenue():

    pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m",
                        "date": "$createdAt"
                    }
                },
                "revenue": {"$sum": "$finalAmount"}
            }
        },
        {"$sort": {"_id": -1}}
    ]

    return list(db.orders.aggregate(pipeline))


################################
# TOP SELLING BOOKS
################################

@mcp.tool()
def top_selling_books():

    pipeline = [
        {"$unwind": "$books"},
        {
            "$group": {
                "_id": "$books.title",
                "sold": {"$sum": 1}
            }
        },
        {"$sort": {"sold": -1}},
        {"$limit": 5}
    ]

    return list(db.orders.aggregate(pipeline))


################################
# TOP REVENUE AUTHOR
################################

@mcp.tool()
def highest_revenue_author():

    pipeline = [
        {"$unwind": "$books"},
        {
            "$group": {
                "_id": "$books.author",
                "revenue": {"$sum": "$books.price"}
            }
        },
        {"$sort": {"revenue": -1}},
        {"$limit": 1}
    ]

    result = list(db.orders.aggregate(pipeline))

    return result[0] if result else {}


################################
# MONTH COMPARISON
################################

@mcp.tool()
def compare_monthly_revenue():

    today = datetime.utcnow()
    current_month_start = today.replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    pipeline = [
        {
            "$match": {
                "createdAt": {
                    "$gte": last_month_start,
                    "$lte": today
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m",
                        "date": "$createdAt"
                    }
                },
                "revenue": {"$sum": "$finalAmount"}
            }
        }
    ]

    return list(db.orders.aggregate(pipeline))


################################
# FORECAST NEXT MONTH REVENUE
################################

@mcp.tool()
def predict_next_month_revenue():

    pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m",
                        "date": "$createdAt"
                    }
                },
                "revenue": {"$sum": "$finalAmount"}
            }
        },
        {"$sort": {"_id": -1}},
        {"$limit": 3}
    ]

    data = list(db.orders.aggregate(pipeline))

    if not data:
        return {"prediction": 0}

    avg = sum(x["revenue"] for x in data) / len(data)

    return {"predicted_next_month_revenue": avg}


################################
# VECTOR RECOMMENDATION TOOL
################################

@mcp.tool()
def recommend_similar_books(query: str):

    embedding = embedding_model.encode(query).tolist()

    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": 100,
                "limit": 5
            }
        },
        {
            "$project": {
                "_id": 0,
                "title": 1,
                "author": 1,
                "category": 1,
                "price": 1,
                "rating": 1,
                "countInStock": 1
            }
        }
    ]

    return list(db.books.aggregate(pipeline))


################################
# CUSTOMERS ALSO BOUGHT
################################

@mcp.tool()
def customers_also_bought(book_title: str):

    pipeline = [
        {"$match": {"books.title": book_title}},
        {"$unwind": "$books"},
        {"$match": {"books.title": {"$ne": book_title}}},
        {
            "$group": {
                "_id": "$books.title",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]

    return list(db.orders.aggregate(pipeline))


################################
# DATE RANGE ANALYTICS  ← NEW
################################

@mcp.tool(name="date_range_analytics", description="Get orders, revenue, new users, books sold, top books and daily breakdown for a date range. Dates must be YYYY-MM-DD.")
def date_range_analytics(start_date: str, end_date: str):
    """
    Get full analytics for a given date range.
    Params:
        start_date: "YYYY-MM-DD"
        end_date:   "YYYY-MM-DD"
    Returns orders count, revenue, new users, books sold, top books in that period.
    """

    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end   = datetime.strptime(end_date,   "%Y-%m-%d").replace(
                    hour=23, minute=59, second=59
                )
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

    date_filter = {"createdAt": {"$gte": start, "$lte": end}}

    # ── Orders count ──────────────────────────────────────
    orders_count = db.orders.count_documents(date_filter)

    # ── Revenue ───────────────────────────────────────────
    rev_pipeline = [
        {"$match": date_filter},
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": "$finalAmount"},
                "avg_order_value": {"$avg": "$finalAmount"}
            }
        }
    ]
    rev_result = list(db.orders.aggregate(rev_pipeline))
    revenue        = rev_result[0]["total_revenue"]   if rev_result else 0
    avg_order_val  = round(rev_result[0]["avg_order_value"], 2) if rev_result else 0

    # ── New users registered in range ─────────────────────
    new_users = db.users.count_documents(date_filter)

    # ── Books sold (units) in range ────────────────────────
    books_pipeline = [
        {"$match": date_filter},
        {"$unwind": "$books"},
        {
            "$group": {
                "_id": None,
                "total_books_sold": {"$sum": 1}
            }
        }
    ]
    books_result     = list(db.orders.aggregate(books_pipeline))
    total_books_sold = books_result[0]["total_books_sold"] if books_result else 0

    # ── Top 5 books sold in range ──────────────────────────
    top_books_pipeline = [
        {"$match": date_filter},
        {"$unwind": "$books"},
        {
            "$group": {
                "_id": "$books.title",
                "author": {"$first": "$books.author"},
                "units_sold": {"$sum": 1},
                "revenue": {"$sum": "$books.price"}
            }
        },
        {"$sort": {"units_sold": -1}},
        {"$limit": 5},
        {
            "$project": {
                "_id": 0,
                "title": "$_id",
                "author": 1,
                "units_sold": 1,
                "revenue": 1
            }
        }
    ]
    top_books = list(db.orders.aggregate(top_books_pipeline))

    # ── Revenue per day in range ───────────────────────────
    daily_pipeline = [
        {"$match": date_filter},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "revenue": {"$sum": "$finalAmount"},
                "orders":  {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "revenue": 1,
                "orders": 1
            }
        }
    ]
    daily_breakdown = list(db.orders.aggregate(daily_pipeline))

    return {
        "period": {
            "from": start_date,
            "to":   end_date
        },
        "summary": {
            "total_orders":      orders_count,
            "total_revenue":     revenue,
            "avg_order_value":   avg_order_val,
            "new_users":         new_users,
            "total_books_sold":  total_books_sold
        },
        "top_books":       top_books,
        "daily_breakdown": daily_breakdown
    }

################################
# USER ORDER PLACEMENT
################################

@mcp.tool(name="place_order", description="Place an order for a specific book on behalf of the user.")
def place_order(user_id: str, book_search_query: str, full_name: str, phone_number: str, street: str, city: str, state: str, zip_code: str):
    """
    Search for a book by title or query and if found, place a Cash on Delivery order 
    using the provided user_id and shipping details.
    """
    try:
        user_oid = ObjectId(user_id)
        user = db.users.find_one({"_id": user_oid})
        if not user:
            return {"error": "Invalid user ID provided."}
    except Exception:
        return {"error": "Invalid user ID format. Ensure user is logged in."}

    # Find book
    pipeline = [
        {"$match": {"title": {"$regex": book_search_query, "$options": "i"}}},
        {"$limit": 1}
    ]
    matched_books = list(db.books.aggregate(pipeline))
    if not matched_books:
        return {"error": f"Could not find any book matching '{book_search_query}'."}
    
    book = matched_books[0]
    
    subtotal = book.get("price", 0)
    tax = subtotal * 0.05
    final_amount = subtotal + tax
    
    order = {
        "orderId": f"ORD-{int(datetime.utcnow().timestamp()*1000)}",
        "user": user["_id"],
        "shippingAddress": {
            "fullName": full_name,
            "email": user.get("email", "N/A"),
            "phoneNumber": phone_number,
            "street": street,
            "city": city,
            "state": state,
            "zipCode": zip_code
        },
        "books": [
            {
                "book": book["_id"],
                "title": book.get("title"),
                "author": book.get("author"),
                "quantity": 1,
                "price": subtotal
            }
        ],
        "totalAmount": subtotal,
        "taxAmount": tax,
        "finalAmount": final_amount,
        "paymentMethod": "Cash on Delivery",
        "paymentStatus": "Unpaid",
        "orderStatus": "Pending",
        "placedAt": datetime.utcnow(),
        "statusTimeline": [
            {"status": "Pending", "timestamp": datetime.utcnow()}
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = db.orders.insert_one(order)
    return {
        "success": True, 
        "order_id": order["orderId"], 
        "message": f"Successfully placed a Cash on Delivery order for '{book.get('title')}'!"
    }


@mcp.tool(name="get_user_orders", description="Get a list of all past orders placed by the user. Can be filtered by order_id or date_str.")
def get_user_orders(user_id: str = None, order_id: str = None, date_str: str = None):
    """
    Fetch the order history for the specified user_id or all orders globally if user_id is omitted. Optionally filter by order_id or date_str (YYYY-MM-DD).
    """
    query = {}
    if user_id and user_id.lower() != "admin":
        try:
            user_oid = ObjectId(user_id)
            query["user"] = user_oid
        except Exception:
            return {"error": "Invalid user ID format."}

    if order_id:
        query["orderId"] = {"$regex": order_id, "$options": "i"}
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d")
            next_day = target_date + timedelta(days=1)
            query["placedAt"] = {"$gte": target_date, "$lt": next_day}
        except ValueError:
            pass

    orders = list(
        db.orders.find(
            query,
            {"_id": 0, "orderId": 1, "finalAmount": 1, "orderStatus": 1, "books.title": 1, "placedAt": 1}
        ).sort("placedAt", -1).limit(20)  # Add limit for safety on global searches
    )

    if not orders:
        if order_id:
            return {"message": f"No order found with ID '{order_id}'."}
        if date_str:
            return {"message": f"No orders found on {date_str}."}
        return {"message": "You have not placed any orders yet."}

    for o in orders:
        if "placedAt" in o and isinstance(o["placedAt"], datetime):
            o["placedAt"] = o["placedAt"].strftime("%Y-%m-%d %H:%M:%S")

    return orders


if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())