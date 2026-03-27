import React, { useEffect } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import ContactUsPage from '../../components/ContactUsPage/ContactUsPage'
import Footer from './../../components/Footer/Footer';

const ContactUs = () => {

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])


    return (
        <>
            <Navbar />
            <ContactUsPage/>
            <Footer/>
        </>
    )
}

export default  ContactUs