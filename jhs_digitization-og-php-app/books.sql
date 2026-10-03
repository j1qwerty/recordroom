-- phpMyAdmin SQL Dump
-- version 4.6.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 03, 2018 at 12:33 PM
-- Server version: 5.7.14
-- PHP Version: 5.6.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `angular`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `book_name` varchar(255) NOT NULL,
  `book_author` varchar(255) NOT NULL,
  `book_price` varchar(255) NOT NULL,
  `book_language` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `book_name`, `book_author`, `book_price`, `book_language`) VALUES
(5, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(4, 'Demo book1', 'Demo auth1', '100', 'Hindi'),
(6, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(7, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(8, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(9, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(10, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(11, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(12, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(13, 'Demo book2', 'Demo auth2', '1002', 'Hindi'),
(14, 'Demo book2', 'Demo auth2', '1002', 'Hindi');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
