<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Expense Tracker</title>
    <link rel="stylesheet" href="style.css">
    <!-- Import Chart.js for charting -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <!-- Import ExcelJS and FileSaver for rich Excel export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
</head>
<body>

    <header>
        <h1>💰 Expense Tracker</h1>
        <div class="controls-group">
            <button onclick="addNewProfileTab()" class="btn" style="background: none; border: 1px dashed rgba(255,255,255,0.5); color: #fff;">+ Add Profile</button>
            <button id="dark-mode-toggle">🌙 Light Mode</button>
            <button id="settings-toggle" class="btn secondary-btn">⚙️ Settings</button>
            <a href="logout.php" style="text-decoration:none;"><button class="btn" style="background:var(--danger-color); color:white;">🚪 Logout</button></a>
            <select id="month-filter">
                <!-- Options populated by JavaScript -->
                <option value="">All Months</option>
            </select>
        </div>
    </header>

    <main>
        <!-- Tab Navigation -->
        <div class="tabs-nav" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;" id="main-tabs-container">
                <button class="tab-btn active" data-tab="tab-dashboard">Household</button>
                <span id="dynamic-profile-tabs-nav"></span>
                <button class="tab-btn" data-tab="tab-investments">Investments</button>
                <button class="tab-btn" data-tab="tab-emi">EMI</button>
                <button class="tab-btn" data-tab="tab-reports">Reports</button>
            </div>
            <div id="dynamic-profile-actions" style="display: none; gap: 10px;"></div>
        </div>

        <div id="tab-dashboard" class="tab-content active">
        <!-- Dashboard Summary Section -->
        <section class="summary-dashboard">
            <h2>Dashboard Overview</h2>
            <div class="summary-cards">
                <div class="card" id="total-income-card">
                    <div class="card-label">Total Income:</div>
                    <div class="card-value"><span class="currency-symbol">AED</span> <span data-value>0.00</span></div>
                </div>
                <div class="card" id="total-expense-card">
                    <div class="card-label">Total Expenses:</div>
                    <div class="card-value"><span class="currency-symbol">AED</span> <span data-value>0.00</span></div>
                </div>
                <div class="card balance-card" id="balance-card">
                    <div class="card-label">Balance:</div>
                    <div class="card-value"><span class="currency-symbol">AED</span> <span data-value>0.00</span></div>
                </div>
                <div class="card" id="savings-card">
                    <div class="card-label">Savings Potential:</div>
                    <div class="card-value"><span class="currency-symbol">AED</span> <span data-value>0.00</span></div>
                </div>
                <div class="card" id="highest-category-card">
                    <div class="card-label">Top Spending Category:</div>
                    <div class="card-value" id="top-spending-category">No expenses</div>
                    <div class="card-value"><span class="currency-symbol">AED</span> <span data-value>0.00</span></div>
                </div>
                <div class="card info-card" id="transaction-count-card">
                    <div class="card-label">Transactions Count:</div>
                    <div class="card-value"><span id="transaction-count" data-value>0</span></div>
                </div>
            </div>
        </section>

        <!-- Input/Transaction Form Section -->
        <section class="form-container">
            <h2>Add New Transaction</h2>
            <form id="transaction-form">
                <div class="input-group form-grid">
                    <div>
                        <label for="date">Date</label>
                        <input type="text" placeholder="dd-mm-yyyy" onfocus="(this.type='date')" onblur="(this.value == '' ? this.type='text' : this.type='date')" id="date" required style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                        <small style="display: block; color: var(--text-muted); font-size: 0.8rem; margin-top: 0.3rem;">Format: dd-mm-yyyy</small>
                    </div>
                    <div>
                        <div class="field-label-row">
                            <label for="type">Type</label>
                            <div class="field-action-group">
                                <button type="button" id="add-type-btn" class="field-action-btn add-action-btn" title="Add a new type">+ Add</button>
                                <button type="button" id="delete-type-btn" class="field-action-btn delete-action-btn" title="Delete the selected custom type">Delete</button>
                            </div>
                        </div>
                        <select id="type" required>
                            <option value="Expense">Expense</option>
                            <option value="Income">Income</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Onhand">Onhand</option>
                        </select>
                    </div>
                    <div>
                        <div class="field-label-row">
                            <label for="category">Category</label>
                            <div class="field-action-group">
                                <button type="button" id="add-category-btn" class="field-action-btn add-action-btn" title="Add a new category">+ Add</button>
                                <button type="button" id="delete-category-btn" class="field-action-btn delete-action-btn" title="Delete the selected custom category">Delete</button>
                            </div>
                        </div>
                        <select id="category" required>
                            <option value="">Select Category</option>
                            <option value="Food & Dining">Food & Dining</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Bills & Utilities">Bills & Utilities</option>
                            <option value="Health">Health</option>
                            <option value="Education">Education</option>
                            <option value="Salary">Salary</option>
                            <option value="Bonus">Bonus</option>
                            <option value="Opening Balance">Opening Balance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div class="input-group form-grid">
                    <div>
                        <div class="field-label-row">
                            <label for="account">Account</label>
                            <div class="field-action-group">
                                <button type="button" id="add-account-btn" class="field-action-btn add-action-btn" title="Add a new account">+ Add</button>
                                <button type="button" id="delete-account-btn" class="field-action-btn delete-action-btn" title="Delete the selected custom account">Delete</button>
                            </div>
                        </div>
                        <select id="account" required>
                        </select>
                    </div>
                    <div>
                        <label for="description">Description</label>
                        <input type="text" id="description" placeholder="e.g., Grocery run" required>
                    </div>
                    <div>
                        <label for="amount">Amount</label>
                        <input type="number" id="amount" placeholder="0.00" step="any" required>
                    </div>
                </div>

                <div class="input-group form-grid">
                    <div>
                        <label for="toAccount">To Account (For Transfers)</label>
                        <select id="toAccount">
                            <option value="">-- Select Destination --</option>
                        </select>
                    </div>
                     <div>
                        <label for="notes">Notes (Optional)</label>
                        <input type="text" id="notes" placeholder="Extra details">
                    </div>
                </div>
            
                <button type="submit" class="btn primary-btn">Add Transaction</button>
            </form>
        </section>

        <!-- Charts and Reports Section -->
        <section class="charts-container">
             <h2>Visual Reports</h2>
            <div class="chart-wrapper grid-2">
                <div class="card chart-card"><canvas id="expenseByCategoryChart"></canvas></div>
                <div class="card chart-card"><canvas id="incomeVsExpenseChart"></canvas></div>
            </div>
             <h2>Monthly Trend</h2>
             <div class="chart-wrapper grid-1">
                <div class="card chart-card" style="width: 100%"><canvas id="monthlyTrendChart"></canvas></div>
            </div>

            <!-- Export and Filtering -->
            <div class="export-section">
                 <h3>Export & Filter</h3>
                 <div class="filter-controls">
                     <button id="exportCsvBtn" class="btn secondary-btn">⬇️ Export CSV</button>
                     <button id="downloadSummaryBtn" class="btn secondary-btn">📄 Download Summary Report</button>
                 </div>
            </div>

        </section>


        <!-- Transaction History Section -->
        <section class="history-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <h2 style="margin-bottom: 0;">Transaction History</h2>
                <input type="text" id="transaction-search" placeholder="Search by date, type, desc, account..." style="padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); width: 100%; max-width: 350px;">
            </div>
            <div class="table-responsive table-scroll-y">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Account</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Amount (Original)</th>
                            <th>To Account</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="transaction-list">
                        <!-- Transactions will be injected here by JavaScript -->
                    </tbody>
                </table>
            </div>
        </section>

        </div> <!-- End Dashboard Tab -->

        <div id="dynamic-profile-tabs-content"></div>

        <!-- Reports Tab -->
        <div id="tab-reports" class="tab-content">
            <section class="summary-dashboard">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 style="margin-bottom: 0;">Account Reports</h2>
                    <button id="exportExcelBtn" class="btn primary-btn" style="background-color: #217346; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.9em; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📊 Export to Excel</button>
                </div>
                <div class="report-filters">
                    <div>
                        <label for="report-month-filter">Month</label>
                        <select id="report-month-filter"><option value="">All Months</option></select>
                    </div>
                    <div>
                        <label for="report-bank-filter">Bank / Account</label>
                        <select id="report-bank-filter"><option value="">All Banks</option></select>
                    </div>
                    <div>
                        <label for="report-category-filter">Category</label>
                        <select id="report-category-filter"><option value="">All Categories</option></select>
                    </div>
                    <div>
                        <label for="report-type-filter">Type</label>
                        <select id="report-type-filter"><option value="">All Types</option></select>
                    </div>
                    <div class="report-filter-action"><button type="button" id="clear-report-filters" class="btn secondary-btn">Clear Filters</button></div>
                </div>
                <div class="summary-cards" style="justify-content: center; flex-wrap: wrap;">
                    <div class="card" id="report-income-card" style="background:var(--success-color); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-income-title" style="font-size: 0.9em; margin-bottom: 5px;">Total Income</span>
                        <span id="report-income" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                    <div class="card" id="report-expense-card" style="background:var(--danger-color); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-expense-title" style="font-size: 0.9em; margin-bottom: 5px;">Total Expenses</span>
                        <span id="report-expense" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                    <div class="card" id="report-debt-card" style="background:#ff9f43; color:#fff; display:none; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-debt-title" style="font-size: 0.9em; margin-bottom: 5px;">Need to Pay</span>
                        <span id="report-debt" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                    <div class="card" id="report-paid-card" style="background:#20c997; color:#fff; display:none; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-paid-title" style="font-size: 0.9em; margin-bottom: 5px;">Total Paid amount</span>
                        <span id="report-paid" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                    <div class="card" id="report-available-card" style="background:#0abde3; color:#fff; display:none; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-available-title" style="font-size: 0.9em; margin-bottom: 5px;">Available AED</span>
                        <span id="report-available" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                    <div class="card balance-card" id="report-net-card" style="background:#a55eea; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <span id="report-net-title" style="font-size: 0.9em; margin-bottom: 5px;">Current Balance</span>
                        <span id="report-net" style="font-size: 1.2em; font-weight: bold;">0.00</span>
                    </div>
                </div>
            </section>
            
            <section class="history-container" style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem;">
                <div style="flex: 1; min-width: 300px; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h3 style="text-align:center;">Expenses by Category</h3>
                    <canvas id="categoryPieChart"></canvas>
                </div>
                <div style="flex: 1; min-width: 300px; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h3 style="text-align:center;">Income vs Expense</h3>
                    <canvas id="incomeExpenseBarChart"></canvas>
                </div>
            </section>

            <section class="history-container">
                <h2>Account Transactions</h2>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Bank / Account</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>To Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="report-transaction-list"></tbody>
                    </table>
                </div>
            </section>
        </div> <!-- End Reports Tab -->

        <!-- Investments Tab -->
        <div id="tab-investments" class="tab-content">
            <section class="history-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h2 style="margin:0;">Investment Details</h2>
                    <button class="btn primary-btn" onclick="openAddInvestmentModal()">+ Add Investment</button>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>SN</th>
                                <th>Investment</th>
                                <th>Investment Plan</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th>Start Date</th>
                                <th>DOP</th>
                                <th>Platform</th>
                                <th>Number</th>
                                <th>Application Number</th>
                                <th>Policy Number</th>
                                <th>Bank</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="investments-tbody">
                            <!-- Injected by script.js -->
                        </tbody>
                    </table>
                </div>
            </section>
            <section class="history-container">
                <h2>Investment Transaction History</h2>
                <p class="section-note">Transactions entered with the category <strong>Investment</strong> appear here automatically.</p>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Date</th><th>Account</th><th>Description</th><th>Type</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead>
                        <tbody id="investment-transaction-list"></tbody>
                    </table>
                </div>
            </section>
        </div> <!-- End Investments Tab -->

        <!-- EMI Tab -->
        <div id="tab-emi" class="tab-content">
            <div class="tab-header" style="display: flex; justify-content: flex-end; margin-bottom: 1rem; width: 100%;">
                <button class="btn primary-btn" id="open-add-emi-modal">+ Add EMI</button>
            </div>
            <div class="chart-wrapper grid-2" id="emi-plans-container">
                <!-- Injected by script.js -->
            </div>
            <section class="history-container">
                <h2>EMI Transaction History</h2>
                <p class="section-note">Transactions entered with the category <strong>EMI</strong> appear here automatically.</p>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Date</th><th>Account</th><th>Description</th><th>Type</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead>
                        <tbody id="emi-transaction-list"></tbody>
                    </table>
                </div>
            </section>
        </div> <!-- End EMI Tab -->

    </main>

    <footer>
        <p>&copy; 2026 Expense Tracker. All rights reserved.</p>
    </footer>

    <!-- Add EMI Row Modal -->
    <div id="add-emi-row-modal" class="modal">
        <div class="modal-content transaction-modal-content">
            <div class="modal-header"><h2>Add EMI Detail</h2><span class="close-btn" id="close-add-emi-row">&times;</span></div>
            <form id="add-emi-row-form">
                <div class="input-group">
                    <div><label for="new-emi-row-date">Date</label><input type="text" id="new-emi-row-date" placeholder="dd-mm-yy" required></div>
                    <div><label for="new-emi-row-amount">Amount</label><input type="number" step="0.01" id="new-emi-row-amount" required></div>
                    <div><label for="new-emi-row-status">Status</label>
                        <select id="new-emi-row-status" required>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" id="cancel-add-emi-row" class="btn secondary-btn">Cancel</button>
                    <button type="submit" class="btn primary-btn">Save Row</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Transaction Modal -->
    <div id="edit-transaction-modal" class="modal" style="z-index: 1050;">
        <div class="modal-content transaction-modal-content">
            <div class="modal-header"><h2>Edit Transaction</h2><span class="close-btn" id="close-edit-transaction">&times;</span></div>
            <form id="edit-transaction-form">
                <input type="hidden" id="edit-id">
                <div class="form-grid compact-grid">
                    <div><label for="edit-date">Date</label><input type="date" id="edit-date" required></div>
                    <div><label for="edit-type">Type</label><select id="edit-type" required></select></div>
                    <div><label for="edit-category">Category</label><select id="edit-category" required></select></div>
                    <div><label for="edit-account">Account</label><select id="edit-account" required></select></div>
                    <div id="edit-to-account-group"><label for="edit-to-account">To Account</label><select id="edit-to-account"></select></div>
                    <div><label for="edit-amount">Amount</label><input type="number" id="edit-amount" step="any" required></div>
                </div>
                <div><label for="edit-description">Description</label><input type="text" id="edit-description" required></div>
                <div class="modal-notes"><label for="edit-notes">Notes</label><input type="text" id="edit-notes"></div>
                <div class="modal-actions"><button type="button" id="cancel-edit-transaction" class="btn secondary-btn">Cancel</button><button type="submit" class="btn primary-btn">Save Changes</button></div>
            </form>
        </div>
    </div>

    <!-- Add Investment Modal -->
    <div id="add-investment-modal" class="modal">
        <div class="modal-content transaction-modal-content investment-modal-content">
            <div class="modal-header"><h2>Add Investment</h2><span class="close-btn" id="close-add-investment">&times;</span></div>
            <form id="add-investment-form">
                <div class="form-grid compact-grid">
                    <div><label for="add-investment-sn">SN</label><input type="number" id="add-investment-sn" min="1" required></div>
                    <div><label for="add-investment-inv">Investment</label><input type="text" id="add-investment-inv" required></div>
                    <div><label for="add-investment-plan">Investment Plan</label><input type="text" id="add-investment-plan" required></div>
                    <div><label for="add-investment-status">Status</label><select id="add-investment-status" required><option value="Active">Active</option><option value="Future">Future</option></select></div>
                    <div><label for="add-investment-amount">Amount</label><input type="text" id="add-investment-amount" placeholder="e.g., 2000/month" required></div>
                    <div><label for="add-investment-start">Start Date</label><input type="text" id="add-investment-start"></div>
                    <div><label for="add-investment-dop">DOP</label><input type="text" id="add-investment-dop"></div>
                    <div><label for="add-investment-platform">Platform</label><input type="text" id="add-investment-platform"></div>
                    <div><label for="add-investment-num">Number</label><input type="text" id="add-investment-num"></div>
                    <div><label for="add-investment-app">Application Number</label><input type="text" id="add-investment-app"></div>
                    <div><label for="add-investment-policy">Policy Number</label><input type="text" id="add-investment-policy"></div>
                    <div><label for="add-investment-bank">Bank</label><input type="text" id="add-investment-bank" placeholder="IOB / Federal"></div>
                </div>
                <div class="modal-actions"><button type="button" id="cancel-add-investment" class="btn secondary-btn">Cancel</button><button type="submit" class="btn primary-btn">Add Investment</button></div>
            </form>
        </div>
    </div>

    <!-- Edit Investment Modal -->
    <div id="edit-investment-modal" class="modal">
        <div class="modal-content transaction-modal-content investment-modal-content">
            <div class="modal-header"><h2>Edit Investment</h2><span class="close-btn" id="close-edit-investment">&times;</span></div>
            <form id="edit-investment-form">
                <input type="hidden" id="edit-investment-index">
                <div class="form-grid compact-grid">
                    <div><label for="edit-investment-sn">SN</label><input type="number" id="edit-investment-sn" min="1" required></div>
                    <div><label for="edit-investment-inv">Investment</label><input type="text" id="edit-investment-inv" required></div>
                    <div><label for="edit-investment-plan">Investment Plan</label><input type="text" id="edit-investment-plan" required></div>
                    <div><label for="edit-investment-status">Status</label><select id="edit-investment-status" required><option value="Active">Active</option><option value="Future">Future</option></select></div>
                    <div><label for="edit-investment-amount">Amount</label><input type="text" id="edit-investment-amount" placeholder="e.g., 2000/month" required></div>
                    <div><label for="edit-investment-start">Start Date</label><input type="text" id="edit-investment-start"></div>
                    <div><label for="edit-investment-dop">DOP</label><input type="text" id="edit-investment-dop"></div>
                    <div><label for="edit-investment-platform">Platform</label><input type="text" id="edit-investment-platform"></div>
                    <div><label for="edit-investment-num">Number</label><input type="text" id="edit-investment-num"></div>
                    <div><label for="edit-investment-app">Application Number</label><input type="text" id="edit-investment-app"></div>
                    <div><label for="edit-investment-policy">Policy Number</label><input type="text" id="edit-investment-policy"></div>
                    <div><label for="edit-investment-bank">Bank</label><input type="text" id="edit-investment-bank" placeholder="IOB / Federal"></div>
                </div>
                <div class="modal-actions"><button type="button" id="cancel-edit-investment" class="btn secondary-btn">Cancel</button><button type="submit" class="btn primary-btn">Save Investment</button></div>
            </form>
        </div>
    </div>

    <!-- Investment Payment History Modal -->
    <div id="investment-payment-history-modal" class="modal">
        <div class="modal-content transaction-modal-content payment-history-modal-content">
            <div class="modal-header"><h2 id="investment-payment-history-title">Payment History</h2><span class="close-btn" id="close-investment-payment-history">&times;</span></div>
            <p id="investment-payment-history-summary" class="section-note"></p>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Date</th><th>Account</th><th>Description</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead>
                    <tbody id="investment-payment-history-list"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Settings Modal -->
    <div id="settings-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Settings</h2>
                <span class="close-btn" id="close-settings">&times;</span>
            </div>
            
            <div class="settings-section">
                <label>Currency</label>
                <div class="currency-toggles">
                    <button class="currency-btn active">$</button>
                    <button class="currency-btn">€</button>
                    <button class="currency-btn">£</button>
                    <button class="currency-btn">₹</button>
                    <button class="currency-btn">AED</button>
                    <button class="currency-btn">¥</button>
                </div>
            </div>

            <div class="settings-section">
                <label>Monthly Budgets by Category</label>
                <div class="budget-list" id="settings-budget-list">
                    <!-- Budgets injected by JS -->
                </div>
            </div>

            <div class="settings-section">
                <label>Security</label>
                <form id="change-password-form" style="margin-top: 10px;">
                    <input type="password" id="current_password" class="form-control" placeholder="Current Password" required style="margin-bottom: 5px;">
                    <input type="password" id="new_password" class="form-control" placeholder="New Password (min 4 chars)" required style="margin-bottom: 5px;">
                    <input type="password" id="confirm_password" class="form-control" placeholder="Confirm New Password" required style="margin-bottom: 5px;">
                    <button type="submit" class="btn primary-btn" style="width: 100%; background: var(--danger-color);">Change Password</button>
                    <div id="password-msg" style="margin-top: 5px; font-size: 0.85em; text-align: center;"></div>
                </form>
            </div>

            <button class="btn primary-btn save-settings-btn" id="save-settings">Save Settings</button>
        </div>
    </div>

    <script>
        // Simple script to toggle modal
        document.getElementById('settings-toggle').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'flex';
        });
        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
        document.getElementById('save-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
        
        // Handle Tab Switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                const tabId = e.target.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Exchange Rates relative to USD ($)
        const exchangeRates = {
            '$': 1.0,
            '€': 0.92,
            '£': 0.79,
            '₹': 83.50,
            'AED': 3.67,
            '¥': 155.00
        };

        let currentSymbol = '$';

        // Handle currency toggle selection
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const newSymbol = e.target.innerText;
                const rate = exchangeRates[newSymbol] / exchangeRates[currentSymbol];
                
                // Update Symbols everywhere
                document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = newSymbol);
                
                // Convert values in dashboard cards and budget list
                document.querySelectorAll('[data-value]:not(#transaction-count), .budget-item input').forEach(el => {
                    let currentVal = el.tagName === 'INPUT' ? parseFloat(el.value) : parseFloat(el.innerText.replace(/,/g, ''));
                    if(!isNaN(currentVal)) {
                        const newVal = currentVal * rate;
                        if(el.tagName === 'INPUT') {
                            el.value = newVal.toFixed(2);
                        } else {
                            el.innerText = newVal.toFixed(2);
                        }
                    }
                });

                currentSymbol = newSymbol;
                localStorage.setItem('currency', newSymbol);
            });
        });

        // Initialize currency from localStorage on load
        window.addEventListener('load', () => {
            const savedCurrency = localStorage.getItem('currency');
            if (savedCurrency && savedCurrency !== '$') {
                document.querySelectorAll('.currency-btn').forEach(btn => {
                    if(btn.innerText === savedCurrency) {
                        btn.click(); // This will trigger the conversion and symbol update
                    }
                });
            }
        });
    </script>
    <script src="script.js"></script>
</body>
</html>
