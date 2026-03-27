import React, { useEffect } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import BooksPage from '../../components/BooksPage/BooksPage'
import Footer from '../../components/Footer/Footer'

const BookPage = () => {

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <>
            <Navbar />
            <BooksPage/>
            <Footer/>
        </>
    )
}

export default BookPage