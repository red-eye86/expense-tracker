# Expense Tracker

A modern, dynamic, and responsive expense tracking web application designed to help you manage your personal finances. This application features dynamic profile tabs, investment tracking, customizable categories and bank accounts, and interactive visualization charts.

## Prerequisites
To run this application locally, you will need a local web server environment that supports PHP and MySQL. We recommend using **XAMPP**.

## Installation & Deployment Guide using XAMPP

1. **Download and Install XAMPP:**
   - Go to the official [Apache Friends](https://www.apachefriends.org/index.html) website.
   - Download XAMPP for your operating system (Windows, macOS, or Linux).
   - Install XAMPP following the standard installation steps.

2. **Clone or Extract the Repository:**
   - Download the source code from this GitHub repository.
   - Extract the folder and rename it to `Expense_Tracker` (if it isn't already).
   - Move the `Expense_Tracker` folder into the XAMPP `htdocs` directory. 
     - **Windows:** `C:\xampp\htdocs\Expense_Tracker`
     - **macOS:** `/Applications/XAMPP/htdocs/Expense_Tracker`
     - **Linux:** `/opt/lampp/htdocs/Expense_Tracker`

3. **Start XAMPP Services:**
   - Open the **XAMPP Control Panel**.
   - Click the **Start** button next to **Apache** (the web server).
   - Click the **Start** button next to **MySQL** (the database server).

4. **Set Up the Database:**
   - Open your web browser and go to `http://localhost/phpmyadmin/`.
   - In phpMyAdmin, click on the **Import** tab at the top.
   - Click **Choose File** and select the `database.sql` file included in this repository.
   - Scroll down and click **Import** (or "Go"). This will automatically create the `expense_tracker` database and its tables (`transactions` and `investments`).

5. **Configure Database Credentials (Optional):**
   - By default, XAMPP uses the username `root` with no password (`""`). The application is already configured to use these defaults. 
   - If you have set a custom password for your local MySQL root user, you must open the `api.php` file and update the `$password = "";` line to match your password.

6. **Run the Application:**
   - Open your web browser and navigate to: `http://localhost/Expense_Tracker/`
   - You should now see the application running. Start tracking your expenses!
