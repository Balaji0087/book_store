import React, { useEffect } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Banner from '../../components/Banner/Banner'
import OurBestSellers from '../../components/OurBestSellers/OurBestSellers'
import HomeAbout from '../../components/HomeAbout/HomeAbout'
import HomeBooks from '../../components/HomeBooks/HomeBooks'
import Footer from '../../components/Footer/Footer'

const Home = () => {

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <>
            <Navbar />
            <Banner />
            <OurBestSellers />
            <HomeBooks />
            <HomeAbout />
            <Footer />
        </>
    )
}

export default Home