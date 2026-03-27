import React, { useEffect } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import AboutUsPage from "../../components/AboutUsPage/AboutUsPage"
import Footer from './../../components/Footer/Footer';


const AboutPage = () => {

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <>
            <Navbar />
            <AboutUsPage />
            <Footer />
        </>
    )
}

export default AboutPage