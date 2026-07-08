// Disable datalabels plugin globally (only enable per-chart for Excel export)
if(typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels = { display: false };
}

// Utility function to prevent XSS attacks
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// --- Dark Mode Logic ---
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}
if(darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

// --- Investment Data ---
const defaultInvestments = [
    { sn: 1, inv: "Equity - Sectoral", plan: "UTI Transportation & Logistics", status: "Active", amount: "10,000/month", start: "01-07-23", dop: "1st", platform: "INDmoney", num: "9846639589", app: "", policy: "", bank: "IOB" },
    { sn: 2, inv: "Mid Cap", plan: "Motilal Oswal Midcap Fund", status: "Active", amount: "5000/month", start: "01-07-25", dop: "1st", platform: "Groww", num: "9846639589", app: "", policy: "", bank: "Federal" },
    { sn: 3, inv: "Flexy Cap", plan: "Parag Flexy Cap", status: "Active", amount: "20,000/month", start: "01-07-23", dop: "1st", platform: "INDmoney", num: "9846639589", app: "", policy: "", bank: "IOB" },
    { sn: 4, inv: "Health Insurance for Family", plan: "Manipal Cigna Sarvah", status: "Active", amount: "23,000/year", start: "28-06-25", dop: "", platform: "Policy Bazaar", num: "553273547", app: "", policy: "SARVAH050074358", bank: "Federal" },
    { sn: 5, inv: "Retainment (Tessy)", plan: "ICICI Life Insurance", status: "Active", amount: "2500/month", start: "20-09-23", dop: "28th", platform: "Policy Bazaar", num: "9846639589", app: "OP00633222", policy: "G9881070", bank: "Federal" },
    { sn: 6, inv: "Term Insurance", plan: "Axis Max Smart Term Plan", status: "Active", amount: "5832/month", start: "09-01-26", dop: "8th", platform: "Policy Bazaar", num: "553273547", app: "189554348", policy: "189554348", bank: "IOB" },
    { sn: 7, inv: "Retainment (Manoj)", plan: "Bajaj Smart Wealth Goal VI", status: "Active", amount: "3000/month", start: "21.04.2026", dop: "21st", platform: "Policy Bazaar", num: "553273547", app: "6165255146", policy: "6165255146", bank: "IOB" },
    { sn: 8, inv: "Flexy Cap", plan: "HDFC Flexi Cap Fund", status: "Active", amount: "2000/month", start: "04-05-26", dop: "1st", platform: "INDmoney", num: "9846639589", app: "", policy: "", bank: "IOB" },
    { sn: 9, inv: "Health Insurance", plan: "For Mummy in Future plan", status: "Future", amount: "32,000/year", start: "", dop: "", platform: "", num: "", app: "", policy: "", bank: "" },
    { sn: 10, inv: "Eadrick", plan: "For Education future plan", status: "Future", amount: "8000/month", start: "", dop: "", platform: "", num: "", app: "", policy: "", bank: "" },
    { sn: 11, inv: "Faidan", plan: "For Education future plan", status: "Future", amount: "5000/month", start: "", dop: "", platform: "", num: "", app: "", policy: "", bank: "" },
    { sn: 12, inv: "Plot and Home", plan: "In Future plan", status: "Future", amount: "5,000,000", start: "", dop: "", platform: "", num: "", app: "", policy: "", bank: "" }
];

let investments = [];

function investmentActionButton(label, className, handler, index) {
    return `<button class="btn ${className}" type="button" onclick="${handler}(${index})">${label}</button>`;
}

function renderInvestments() {
    const tbody = document.getElementById('investments-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    investments.forEach((inv, index) => {
        const badgeClass = String(inv.status || '').toLowerCase() === 'active' ? 'active' : 'future';
        const canLogPayment = String(inv.status || '').toLowerCase() === 'active';
        tbody.innerHTML += `
            <tr>
                <td>${escapeHTML(String(inv.sn ?? index + 1))}</td>
                <td>${escapeHTML(inv.inv || '')}</td>
                <td>${escapeHTML(inv.plan || '')}</td>
                <td><span class="status-badge ${badgeClass}">${escapeHTML(inv.status || '')}</span></td>
                <td>${escapeHTML(inv.amount || '')}</td>
                <td>${escapeHTML(inv.start || '')}</td>
                <td>${escapeHTML(inv.dop || '')}</td>
                <td>${escapeHTML(inv.platform || '')}</td>
                <td>${escapeHTML(inv.num || '')}</td>
                <td>${escapeHTML(inv.app || '')}</td>
                <td>${escapeHTML(inv.policy || '')}</td>
                <td>${escapeHTML(inv.bank || '')}</td>
                <td>
                    <div class="action-buttons investment-actions">
                        ${investmentActionButton('Edit', 'primary-btn', 'editInvestment', index)}
                        ${investmentActionButton('Delete', 'secondary-btn', 'deleteInvestment', index)}
                        ${canLogPayment ? investmentActionButton('Log Payment', 'primary-btn', 'logInvPayment', index) : ''}
                        ${investmentActionButton('Payment History', 'secondary-btn', 'showInvestmentPaymentHistory', index)}
                    </div>
                </td>
            </tr>`;
    });
}

function saveInvestmentsToDatabase() {
    return fetch('api.php?action=sync_investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investments)
    }).then(res => res.json()).then(data => {
        if (data.status !== 'success') throw new Error(data.message || 'Unable to save investment details.');
        return data;
    });
}

function investmentPaymentTransactions(investment) {
    // Use the investment plan name only. Investment labels such as "Flexy Cap"
    // can be shared by more than one fund, so using them caused mixed payment histories.
    const plan = String(investment?.plan || '').trim().toLowerCase();
    if (!plan) return [];

    return transactions
        .filter(t => {
            if (String(t.category || '').trim().toLowerCase() !== 'investment') return false;
            const description = String(t.description || '').trim().toLowerCase();
            const notes = String(t.notes || '').toLowerCase();
            return description === plan || notes.includes(`investment plan: ${plan}`);
        })
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0));
}

window.showInvestmentPaymentHistory = function(index) {
    const investment = investments[index];
    const modal = document.getElementById('investment-payment-history-modal');
    const title = document.getElementById('investment-payment-history-title');
    const tbody = document.getElementById('investment-payment-history-list');
    const summary = document.getElementById('investment-payment-history-summary');
    if (!investment || !modal || !title || !tbody || !summary) return;

    const records = investmentPaymentTransactions(investment);
    title.textContent = `Payment History — ${investment.plan || investment.inv || 'Investment'}`;
    const total = records.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    summary.textContent = `${records.length} payment(s) logged • Total: ${records.length ? currencyForAccount(records[0].account) : 'INR'} ${total.toFixed(2)}`;
    
    let html = records.length ? records.map(t => `
        <tr>
            <td>${escapeHTML(t.date || '')}</td>
            <td><strong>${escapeHTML(shortAccount(t.account))}</strong></td>
            <td>${escapeHTML(t.description || '')}</td>
            <td>${escapeHTML(t.category || '')}</td>
            <td class="${t.type === 'Income' ? 'text-success' : 'text-danger'}">${currencyForAccount(t.account)} ${Number(t.amount || 0).toFixed(2)}</td>
            <td>${escapeHTML(t.notes || '')}</td>
            <td>${transactionActions(t.id)}</td>
        </tr>`).join('') : '<tr><td colspan="7" class="empty-table-message">No payments have been logged for this investment.</td></tr>';
    
    if (records.length > 0) {
        html += `
        <tr style="background-color: rgba(255, 255, 255, 0.05); font-weight: bold;">
            <td colspan="4" style="text-align: right; padding-right: 15px;">Total Amount:</td>
            <td class="text-danger">${records.length ? currencyForAccount(records[0].account) : 'INR'} ${total.toFixed(2)}</td>
            <td colspan="2"></td>
        </tr>
        `;
    }
    
    tbody.innerHTML = html;
    modal.style.display = 'flex';
};

function closeInvestmentPaymentHistory() {
    const modal = document.getElementById('investment-payment-history-modal');
    if (modal) modal.style.display = 'none';
}

window.editInvestment = function(index) {
    const investment = investments[index];
    const modal = document.getElementById('edit-investment-modal');
    if (!investment || !modal) return;
    document.getElementById('edit-investment-index').value = index;
    const fields = ['sn', 'inv', 'plan', 'status', 'amount', 'start', 'dop', 'platform', 'num', 'app', 'policy', 'bank'];
    fields.forEach(field => {
        const element = document.getElementById(`edit-investment-${field}`);
        if (element) element.value = investment[field] || '';
    });
    modal.style.display = 'flex';
};

function closeEditInvestmentModal() {
    const modal = document.getElementById('edit-investment-modal');
    if (modal) modal.style.display = 'none';
}

window.openAddInvestmentModal = function() {
    document.getElementById('add-investment-form').reset();
    document.getElementById('add-investment-sn').value = investments.length + 1;
    document.getElementById('add-investment-modal').style.display = 'flex';
};

window.closeAddInvestmentModal = function() {
    const modal = document.getElementById('add-investment-modal');
    if (modal) modal.style.display = 'none';
};

window.deleteInvestment = function(index) {
    const investment = investments[index];
    if (!investment) return;
    if (!confirm(`Delete the investment record for "${investment.plan || investment.inv}"?\n\nExisting payment transactions will remain in Transaction History.`)) return;
    const before = [...investments];
    investments.splice(index, 1);
    investments.forEach((item, position) => item.sn = position + 1);
    saveInvestmentsToDatabase().then(() => {
        renderAll();
        alert('Investment record deleted successfully.');
    }).catch(error => {
        investments = before;
        renderAll();
        alert(error.message || 'Could not delete the investment record.');
    });
};

// Create a real Expense transaction when an investment payment is logged.
// The payment will then appear automatically in Household, Manoj/Wife,
// Investment Transaction History, Reports, and the account balance.
function getInvestmentPaymentAmount(amountText) {
    const match = String(amountText || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
}

function getInvestmentPaymentAccount(bankName) {
    const bank = String(bankName || '').toLowerCase();
    if (bank.includes('iob')) return 'IOB NRO (INR)';
    if (bank.includes('federal')) return 'Federal Bank NRO (INR)';
    if (bank.includes('adcb')) return 'ADCB (AED)';
    return '';
}

window.logInvPayment = function(index) {
    const investment = investments[index];
    if (!investment) {
        alert('Investment record was not found. Please refresh the page and try again.');
        return;
    }

    const amount = getInvestmentPaymentAmount(investment.amount);
    const account = getInvestmentPaymentAccount(investment.bank);

    if (!amount) {
        alert('The payment amount is not valid for this investment.');
        return;
    }
    if (!account) {
        alert('No linked account is set for this investment. Please update its bank details first.');
        return;
    }

    const defaultDate = new Date().toISOString().slice(0, 10);
    const dateInput = prompt(
        `Log payment for ${investment.plan}?\nAmount: ${amount.toFixed(2)}\nAccount: ${account}\n\nEnter payment date (YYYY-MM-DD):`,
        defaultDate
    );
    if (dateInput === null) return;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        alert('Invalid date format. Please use YYYY-MM-DD.');
        return;
    }

    const isPastTransaction = confirm(
        `Is this a PAST transaction that should NOT deduct from your current bank balance?\n\n• Click OK if this is a historical record.\n• Click Cancel if this is a new payment that should deduct from your balance.`
    );

    const paymentType = isPastTransaction ? 'Historical' : 'Expense';

    const payment = {
        date: dateInput,
        type: paymentType,
        category: 'Investment',
        account,
        toAccount: '',
        description: investment.plan,
        amount,
        // Store the full plan name in notes as a second, unique reference for future matching.
        notes: `Investment payment logged | Investment plan: ${investment.plan}`
    };

    fetch('api.php?action=add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status !== 'success') {
            throw new Error(data.message || 'Unable to save the payment.');
        }
        payment.id = data.id;
        transactions.unshift(payment);
        renderAll();
        showInvestmentPaymentHistory(index);
    })
    .catch(error => {
        console.error(error);
        alert('Payment could not be saved. Please check that api.php and the database are working.');
    });
}

// --- Dynamic Profile Tabs ---
let dynamicProfiles = JSON.parse(localStorage.getItem('dynamicProfiles')) || [
    { id: 'tab-manoj', name: 'Name 01', accounts: ['Federal Bank NRE (INR)', 'Federal Bank NRO (INR)', 'IOB NRO (INR)', 'ADCB (AED)', 'Emirates NBD CC (AED)'] },
    { id: 'tab-wife', name: 'Name 02', accounts: ['Tessy Federal (INR)', 'Tessy Union Bank (INR)', 'Tessy State Bank (INR)'] }
];

function saveDynamicProfiles() {
    localStorage.setItem('dynamicProfiles', JSON.stringify(dynamicProfiles));
}

function renderAndKeepTab() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    const activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : null;
    
    renderAll();
    
    if (activeTabId) {
        const tabToClick = document.querySelector(`.tab-btn[data-tab="${activeTabId}"]`);
        if (tabToClick) {
            tabToClick.click();
        }
    }
}

window.addNewProfileTab = function() {
    const name = prompt("Enter the name for the new Profile Tab:");
    if (name !== null && name.trim() !== '') {
        const newId = 'tab-custom-' + Date.now();
        dynamicProfiles.push({ id: newId, name: name.trim(), accounts: [] });
        saveDynamicProfiles();
        renderAndKeepTab();
    }
}

window.editProfileName = function(profileId) {
    const profile = dynamicProfiles.find(p => p.id === profileId);
    if (profile) {
        const newName = prompt("Enter new name for this Profile:", profile.name);
        if (newName !== null && newName.trim() !== '') {
            profile.name = newName.trim();
            saveDynamicProfiles();
            renderAndKeepTab();
        }
    }
}

window.deleteProfileTab = function(profileId) {
    if (confirm("Are you sure you want to completely delete this Profile Tab?")) {
        dynamicProfiles = dynamicProfiles.filter(p => p.id !== profileId);
        saveDynamicProfiles();
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const dashboardBtn = document.querySelector('[data-tab="tab-dashboard"]');
        if (dashboardBtn) dashboardBtn.classList.add('active');
        const dashboardTab = document.getElementById('tab-dashboard');
        if (dashboardTab) dashboardTab.classList.add('active');
        renderAll();
    }
}

window.addAccountToProfile = function(profileId) {
    const profile = dynamicProfiles.find(p => p.id === profileId);
    if (profile) {
        const accountName = prompt("Enter the exact Account Name to link (e.g. 'ADCB (AED)'):");
        if (accountName !== null && accountName.trim() !== '') {
            const accClean = accountName.trim();
            profile.accounts.push(accClean);
            saveDynamicProfiles();
            
            // Also add to global accounts list if not present
            const customItems = getStoredList('expenseTrackerCustomAccounts');
            const allItems = [...DEFAULT_ACCOUNTS, ...customItems];
            if (!allItems.some(item => item.toLowerCase() === accClean.toLowerCase())) {
                customItems.push(accClean);
                saveStoredList('expenseTrackerCustomAccounts', customItems);
                refreshSelects(['account', 'toAccount', 'edit-account', 'edit-to-account', 'report-bank-filter'], DEFAULT_ACCOUNTS, 'expenseTrackerCustomAccounts');
            }
            
            renderAndKeepTab();
        }
    }
}

window.removeAccountFromProfile = function(profileId, accountIndex) {
    const profile = dynamicProfiles.find(p => p.id === profileId);
    if (profile && confirm("Remove this account link from the profile?")) {
        profile.accounts.splice(accountIndex, 1);
        saveDynamicProfiles();
        renderAndKeepTab();
    }
}

function renderProfiles() {
    const navContainer = document.getElementById('dynamic-profile-tabs-nav');
    const contentContainer = document.getElementById('dynamic-profile-tabs-content');
    if (!navContainer || !contentContainer) return;

    let navHTML = '';
    let contentHTML = '';

    dynamicProfiles.forEach(profile => {
        navHTML += `<button class="tab-btn" data-tab="${profile.id}">${escapeHTML(profile.name)}</button>`;

        let accountsCardsHTML = '';
        profile.accounts.forEach((acc, index) => {
            const accClean = escapeHTML(acc);
            accountsCardsHTML += `
                <div class="card balance-card" style="background:var(--success-color); color:#fff; cursor:pointer;" onclick="goToAccountReport('${accClean}')">
                    ${accClean} <span id="bal-dyn-${profile.id}-${index}">0.00</span>
                    <button onclick="event.stopPropagation(); removeAccountFromProfile('${profile.id}', ${index})" style="background:none; border:none; color:white; font-size:12px; margin-left:10px; cursor:pointer;">&times;</button>
                </div>
            `;
        });
        
        accountsCardsHTML += `<div class="card balance-card" style="background:rgba(255,255,255,0.1); border: 1px dashed rgba(255,255,255,0.5); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="addAccountToProfile('${profile.id}')">+ Add Account</div>`;

        contentHTML += `
        <div id="${profile.id}" class="tab-content">
            <div class="tab-header" style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
            </div>
            <section class="summary-dashboard">
                <h2>${escapeHTML(profile.name)}'s Accounts</h2>
                <div class="summary-cards">
                    ${accountsCardsHTML}
                </div>
            </section>
            <section class="history-container">
                <h2>${escapeHTML(profile.name)}'s Transactions</h2>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>To Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tx-list-${profile.id}"></tbody>
                    </table>
                </div>
            </section>
        </div>`;
    });

    navContainer.innerHTML = navHTML;
    contentContainer.innerHTML = contentHTML;
    
    // Ensure actions are up to date with the currently active tab after rendering
    updateDynamicProfileActions();
}

function updateDynamicProfileActions() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    const tabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : null;
    const actionsDiv = document.getElementById('dynamic-profile-actions');
    
    if (actionsDiv) {
        const isDynamic = dynamicProfiles.some(p => p.id === tabId);
        if (isDynamic) {
            actionsDiv.style.display = 'flex';
            actionsDiv.innerHTML = `
                <button class="btn secondary-btn" onclick="editProfileName('${tabId}')" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Edit Tab Name</button>
                <button class="btn delete-action-btn" onclick="deleteProfileTab('${tabId}')" style="background:#ef4444; color:white; border:none; padding:0.3rem 0.6rem; border-radius:4px; font-size: 0.8rem; cursor:pointer;">Delete Tab</button>
            `;
        } else {
            actionsDiv.style.display = 'none';
        }
    }
}

// --- Dynamic EMI Tracker ---
let dynamicEmis = JSON.parse(localStorage.getItem('dynamicEmis')) || [
    { id: 1, title: 'EMI Plan 1', totalAmount: 0, rows: [] },
    { id: 2, title: 'EMI Plan 2', totalAmount: 0, rows: [] },
    { id: 3, title: 'EMI Plan 3', totalAmount: 0, rows: [] }
];

function saveDynamicEmis() {
    localStorage.setItem('dynamicEmis', JSON.stringify(dynamicEmis));
}

function renderDynamicEmis() {
    const container = document.getElementById('emi-plans-container');
    if (!container) return;
    container.innerHTML = '';
    
    dynamicEmis.forEach(plan => {
        let tbodyHTML = '';
        let totalBalance = parseFloat(plan.totalAmount || 0);
        let totalPaid = 0;
        
        plan.rows.forEach((row, index) => {
            if (row.status === 'Paid') {
                totalPaid += parseFloat(row.amount || 0);
            }
            
            let badgeClass = row.status.toLowerCase() === 'paid' ? 'active' : 'pending';
            let actionBtn = row.status === 'Pending' ? 
                `<button class="btn primary-btn" onclick="markDynamicEmiPaid(${plan.id}, ${index})" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Pay</button>` 
                : `<button class="btn secondary-btn" disabled style="padding: 0.2rem 0.5rem; font-size: 0.8rem; opacity:0.5;">Paid</button>`;
                
            tbodyHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(row.date)}</td>
                    <td>${escapeHTML(row.amount.toString())}</td>
                    <td><span class="status-badge ${badgeClass}">${escapeHTML(row.status)}</span></td>
                    <td>${actionBtn} <button class="btn delete-action-btn" onclick="deleteEmiRow(${plan.id}, ${index})" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; margin-left: 5px;">Del</button></td>
                </tr>
            `;
        });
        
        let remainingBalance = totalBalance - totalPaid;
        if (remainingBalance < 0) remainingBalance = 0;
        
        container.innerHTML += `
            <section class="history-container">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>${escapeHTML(plan.title)}</h2>
                    <div>
                        <button class="btn delete-action-btn" onclick="deleteEmiPlan(${plan.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #ef4444; color: white; border: none; cursor: pointer; border-radius: 4px; margin-right: 5px;">Del</button>
                        <button class="btn secondary-btn" onclick="editEmiPlanName(${plan.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 5px;">Edit</button>
                        <button class="btn primary-btn" onclick="openAddEmiRowModal(${plan.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Add</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>SN</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>${tbodyHTML}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>Total Loan</strong></td>
                                <td colspan="3"><strong>${totalBalance.toFixed(2)}</strong></td>
                            </tr>
                            <tr>
                                <td colspan="2" style="color: #f97316;"><strong>Remaining</strong></td>
                                <td colspan="3" style="color: #f97316;"><strong>${remainingBalance.toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        `;
    });
}

window.markDynamicEmiPaid = function(planId, rowIndex) {
    const plan = dynamicEmis.find(p => p.id === planId);
    if (plan && confirm("Mark this EMI as Paid?")) {
        plan.rows[rowIndex].status = 'Paid';
        saveDynamicEmis();
        renderDynamicEmis();
    }
}

window.deleteEmiRow = function(planId, rowIndex) {
    const plan = dynamicEmis.find(p => p.id === planId);
    if (plan && confirm("Delete this EMI row?")) {
        plan.rows.splice(rowIndex, 1);
        saveDynamicEmis();
        renderDynamicEmis();
    }
}

window.editEmiPlanName = function(planId) {
    const plan = dynamicEmis.find(p => p.id === planId);
    if (plan) {
        const newName = prompt("Enter new name for this EMI Plan:", plan.title);
        if (newName !== null && newName.trim() !== '') {
            plan.title = newName.trim();
            const newTotal = prompt("Enter the Total Loan Amount for this EMI:", plan.totalAmount || 0);
            if (newTotal !== null) {
                plan.totalAmount = parseFloat(newTotal) || 0;
            }
            saveDynamicEmis();
            renderDynamicEmis();
        }
    }
}

window.deleteEmiPlan = function(planId) {
    if (confirm("Are you sure you want to completely delete this entire EMI Plan? This cannot be undone.")) {
        dynamicEmis = dynamicEmis.filter(p => p.id !== planId);
        saveDynamicEmis();
        renderDynamicEmis();
    }
}

window.addNewEmiPlan = function() {
    const name = prompt("Enter the name for the new EMI Plan:");
    if (name !== null && name.trim() !== '') {
        const total = prompt("Enter the Total Loan Amount for this EMI:", "0");
        const totalAmount = parseFloat(total) || 0;
        const newId = Date.now();
        dynamicEmis.push({ id: newId, title: name.trim(), totalAmount: totalAmount, rows: [] });
        saveDynamicEmis();
        renderDynamicEmis();
    }
}

let currentEmiPlanIdForAdd = null;
window.openAddEmiRowModal = function(planId) {
    currentEmiPlanIdForAdd = planId;
    const modal = document.getElementById('add-emi-row-modal');
    if(modal) modal.style.display = 'flex';
}

window.closeAddEmiRowModal = function() {
    const modal = document.getElementById('add-emi-row-modal');
    if(modal) modal.style.display = 'none';
    const form = document.getElementById('add-emi-row-form');
    if(form) form.reset();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-add-emi-row')?.addEventListener('click', closeAddEmiRowModal);
    document.getElementById('cancel-add-emi-row')?.addEventListener('click', closeAddEmiRowModal);
    document.getElementById('open-add-emi-modal')?.addEventListener('click', addNewEmiPlan);

    document.getElementById('add-emi-row-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!currentEmiPlanIdForAdd) return;
        
        const plan = dynamicEmis.find(p => p.id === currentEmiPlanIdForAdd);
        if (plan) {
            plan.rows.push({
                date: document.getElementById('new-emi-row-date').value,
                amount: parseFloat(document.getElementById('new-emi-row-amount').value),
                status: document.getElementById('new-emi-row-status').value
            });
            saveDynamicEmis();
            renderDynamicEmis();
            closeAddEmiRowModal();
        }
    });
});

// --- Transaction Logic ---
let transactions = [];

// Custom types and categories are stored in the browser so they remain available after refresh.
const DEFAULT_TYPES = ['Expense', 'Income', 'Transfer', 'Onhand'];
const DEFAULT_CATEGORIES = [
    'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Health', 'Education', 'Salary', 'Bonus',
    'Opening Balance', 'Other', 'Investment', 'EMI'
];
const DEFAULT_ACCOUNTS = [
    'ADCB (AED)', 'Emirates NBD CC (AED)', 'Federal Bank NRE (INR)',
    'Federal Bank NRO (INR)', 'IOB NRO (INR)', 'Tessy Federal (INR)',
    'Tessy Union Bank (INR)', 'Tessy State Bank (INR)'
];

function getStoredList(storageKey) {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveStoredList(storageKey, items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
}

function refreshSelects(selectIds, defaultItems, storageKey, placeholder = '') {
    const allItems = [...defaultItems, ...getStoredList(storageKey)];
    const items = [...new Set(allItems)];

    const idArray = Array.isArray(selectIds) ? selectIds : [selectIds];
    
    idArray.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const selectedValue = select.value;
        
        let pText = placeholder;
        if (id === 'report-bank-filter') pText = 'All Banks';
        if (id === 'toAccount') pText = '-- Select Destination --';
        if (id === 'edit-to-account') pText = '';

        select.innerHTML = pText ? `<option value="">${escapeHTML(pText)}</option>` : '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
        
        if (items.includes(selectedValue)) {
            select.value = selectedValue;
        }
    });
}

function setupListControls({ selectIds, addButtonId, deleteButtonId, defaultItems, storageKey, label, placeholder = '' }) {
    const idArray = Array.isArray(selectIds) ? selectIds : [selectIds];
    const mainSelectId = idArray[0];
    const addButton = document.getElementById(addButtonId);
    const deleteButton = document.getElementById(deleteButtonId);

    refreshSelects(idArray, defaultItems, storageKey, placeholder);

    if (addButton) {
        addButton.addEventListener('click', () => {
            const input = prompt(`Enter the new ${label.toLowerCase()} name:`);
            if (input === null) return;

            const item = input.trim();
            if (!item) {
                alert(`Please enter a ${label.toLowerCase()} name.`);
                return;
            }

            const allItems = [...defaultItems, ...getStoredList(storageKey)];
            const duplicate = allItems.some(existing => existing.toLowerCase() === item.toLowerCase());
            if (duplicate) {
                alert(`This ${label.toLowerCase()} already exists.`);
                return;
            }

            const customItems = getStoredList(storageKey);
            customItems.push(item);
            saveStoredList(storageKey, customItems);
            refreshSelects(idArray, defaultItems, storageKey, placeholder);
            
            const mainSelect = document.getElementById(mainSelectId);
            if (mainSelect) mainSelect.value = item;
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            const mainSelect = document.getElementById(mainSelectId);
            const selectedValue = mainSelect ? mainSelect.value : '';
            if (!selectedValue || selectedValue === '') {
                alert(`Please select a ${label.toLowerCase()} to delete.`);
                return;
            }

            const isDefault = defaultItems.some(item => item.toLowerCase() === selectedValue.toLowerCase());
            if (isDefault) {
                alert(`You cannot delete a default ${label.toLowerCase()}.`);
                return;
            }

            if (!confirm(`Are you sure you want to delete the custom ${label.toLowerCase()} "${selectedValue}"?`)) return;

            let customItems = getStoredList(storageKey);
            customItems = customItems.filter(item => item.toLowerCase() !== selectedValue.toLowerCase());
            saveStoredList(storageKey, customItems);
            refreshSelects(idArray, defaultItems, storageKey, placeholder);
        });
    }
}

function setupTransactionFieldControls() {
    setupListControls({
        selectIds: ['type', 'edit-type', 'report-type-filter'],
        addButtonId: 'add-type-btn',
        deleteButtonId: 'delete-type-btn',
        defaultItems: DEFAULT_TYPES,
        storageKey: 'expenseTrackerCustomTypes',
        label: 'Type'
    });

    setupListControls({
        selectIds: ['category', 'edit-category', 'report-category-filter'],
        addButtonId: 'add-category-btn',
        deleteButtonId: 'delete-category-btn',
        defaultItems: DEFAULT_CATEGORIES,
        storageKey: 'expenseTrackerCustomCategories',
        label: 'Category',
        placeholder: 'Select Category'
    });

    setupListControls({
        selectIds: ['account', 'toAccount', 'edit-account', 'edit-to-account', 'report-bank-filter'],
        addButtonId: 'add-account-btn',
        deleteButtonId: 'delete-account-btn',
        defaultItems: DEFAULT_ACCOUNTS,
        storageKey: 'expenseTrackerCustomAccounts',
        label: 'Account'
    });
}

// Toggle To Account
const typeSelect = document.getElementById('type');
const toAccountGroup = document.getElementById('toAccount').parentElement;
toAccountGroup.style.display = 'none';

typeSelect.addEventListener('change', function(e) {
    if(e.target.value === 'Transfer') {
        toAccountGroup.style.display = 'block';
    } else {
        toAccountGroup.style.display = 'none';
        document.getElementById('toAccount').value = '';
    }
});

document.getElementById('transaction-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const t = {
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        account: document.getElementById('account').value,
        toAccount: document.getElementById('toAccount').value,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        notes: document.getElementById('notes').value
    };
    
    fetch('api.php?action=add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
    }).then(res => res.json()).then(data => {
        if(data.status === 'success') {
            t.id = data.id;
            transactions.unshift(t); // Add to beginning
            this.reset();
            toAccountGroup.style.display = 'none';
            renderAll();
        } else {
            alert('Error adding transaction: ' + data.message);
        }
    }).catch(err => alert('Network Error'));
});

function renderTransactions() {
    const globalTbody = document.getElementById('transaction-list');
    const manojTbody = document.getElementById('manoj-transaction-list');
    const wifeTbody = document.getElementById('wife-transaction-list');
    
    if(globalTbody) globalTbody.innerHTML = '';
    if(manojTbody) manojTbody.innerHTML = '';
    if(wifeTbody) wifeTbody.innerHTML = '';

    let rateAED = 3.67;
    let rateINR = 83.50;
    if (typeof exchangeRates !== 'undefined') {
        rateAED = exchangeRates['AED'] || 3.67;
        rateINR = exchangeRates['₹'] || 83.50;
    }

    getFilteredTransactions().forEach((t) => {
        let badgeClass = 'active'; // Expense
        if(t.type === 'Income' || t.type === 'Onhand') badgeClass = 'future';
        if(t.type === 'Transfer') badgeClass = 'pending';
        
        let isAED = t.account.includes('(AED)');
        let currency = isAED ? 'AED' : 'INR';
        
        let rowHtml = (curr, amt, typeBadge, typeText, showToAcc) => `
            <tr>
                <td>${escapeHTML(t.date)}</td>
                <td><strong>${escapeHTML(t.account.replace(/ \(.+\)/, ''))}</strong></td>
                <td>${escapeHTML(t.description)}</td>
                <td>${escapeHTML(t.category)}</td>
                <td><span class="status-badge ${typeBadge}">${escapeHTML(typeText)}</span></td>
                <td>${escapeHTML(curr)} ${amt.toFixed(2)}</td>
                <td>${showToAcc && t.toAccount ? escapeHTML(t.toAccount.replace(/ \(.+\)/, '')) : '-'}</td>
                <td>${escapeHTML(t.notes || '')}</td>
                <td><button class="btn secondary-btn" onclick="deleteTransaction(${t.id})" style="padding:0.2rem 0.5rem; font-size:0.8rem">Delete</button></td>
            </tr>
        `;

        if(globalTbody) globalTbody.innerHTML += rowHtml(currency, t.amount, badgeClass, t.type, t.type === 'Transfer');

        let isManoj = t.account !== 'Tessy Federal (INR)';
        let isToTessy = t.toAccount === 'Tessy Federal (INR)';

        if (t.type === 'Transfer') {
            let fromAED = t.account.includes('(AED)');
            let toAED = t.toAccount.includes('(AED)');
            let convertedAmt = t.amount;
            if (fromAED && !toAED) convertedAmt = t.amount * (rateINR / rateAED);
            if (!fromAED && toAED) convertedAmt = t.amount * (rateAED / rateINR);
            let toCurr = toAED ? 'AED' : 'INR';

            // Add to Sender's Table
            if (isManoj && manojTbody) manojTbody.innerHTML += rowHtml(currency, t.amount, 'active', 'Sent', true);
            else if (!isManoj && wifeTbody) wifeTbody.innerHTML += rowHtml(currency, t.amount, 'active', 'Sent', true);

            // Add to Receiver's Table
            if (isToTessy && wifeTbody) {
                wifeTbody.innerHTML += rowHtml(toCurr, convertedAmt, 'future', 'Received', false);
            } else if (!isToTessy && manojTbody) {
                manojTbody.innerHTML += rowHtml(toCurr, convertedAmt, 'future', 'Received', false);
            }
        } else {
            if (isManoj && manojTbody) {
                manojTbody.innerHTML += rowHtml(currency, t.amount, badgeClass, t.type, false);
            } else if (!isManoj && wifeTbody) {
                wifeTbody.innerHTML += rowHtml(currency, t.amount, badgeClass, t.type, false);
            }
        }
    });
}

window.deleteTransaction = function(id) {
    if(confirm('Are you sure you want to delete this transaction?')) {
        fetch('api.php?action=delete_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id: id})
        }).then(res => res.json()).then(data => {
            if(data.status === 'success') {
                transactions = transactions.filter(t => t.id != id);
                renderAll();
            } else {
                alert('Error deleting transaction');
            }
        });
    }
}

function updateDashboardTotals() {
    // Dashboard income, expense, savings, and top-category cards follow the selected month.
    // Account balances always use every transaction, so the balance remains correct.
    const dashboardTransactions = getFilteredTransactions();
    const balanceTransactions = transactions;
    const accountBalances = {};

    const processAmount = (account, amount, isAdding) => {
        if (!account) return;
        if (!accountBalances[account]) accountBalances[account] = 0;
        accountBalances[account] += (isAdding ? 1 : -1) * Number(amount || 0);
    };

    let totalIncomeUSD = 0;
    let totalExpenseUSD = 0;
    let investmentUSD = 0;
    const categoryTotalsUSD = {};

    const rateAED = (typeof exchangeRates !== 'undefined' && exchangeRates['AED']) || 3.67;
    const rateINR = (typeof exchangeRates !== 'undefined' && exchangeRates['₹']) || 83.50;
    const toUSD = (amount, account) => Number(amount || 0) / (String(account || '').includes('(AED)') ? rateAED : rateINR);

    // Total Income includes Income and Onhand entries. Opening Balance income is kept out
    // because it is already represented by Onhand/account balance entries.
    dashboardTransactions.forEach(t => {
        const amountUSD = toUSD(t.amount, t.account);
        if (t.type === 'Income' && t.category !== 'Opening Balance') {
            totalIncomeUSD += amountUSD;
        }
        if (t.type === 'Onhand') {
            totalIncomeUSD += amountUSD;
        }
        if (t.type === 'Expense' && t.category !== 'Opening Balance') {
            totalExpenseUSD += amountUSD;
            categoryTotalsUSD[t.category || 'Other'] = (categoryTotalsUSD[t.category || 'Other'] || 0) + amountUSD;
            if (String(t.category || '').toLowerCase() === 'investment') {
                investmentUSD += amountUSD;
            }
        }
    });

    // Calculate the balance with every saved transaction, not only the dashboard month filter.
    balanceTransactions.forEach(t => {
        if (t.type === 'Income' || t.type === 'Onhand') {
            processAmount(t.account, t.amount, true);
        } else if (t.type === 'Expense') {
            processAmount(t.account, t.amount, false);
        } else if (t.type === 'Transfer') {
            processAmount(t.account, t.amount, false);
            const fromAED = String(t.account || '').includes('(AED)');
            const toAED = String(t.toAccount || '').includes('(AED)');
            let convertedAmount = Number(t.amount || 0);
            if (fromAED && !toAED) convertedAmount *= (rateINR / rateAED);
            else if (!fromAED && toAED) convertedAmount *= (rateAED / rateINR);
            processAmount(t.toAccount, convertedAmount, true);
        }
    });

    // Emirates NBD CC has an initial debt baseline we must preserve 
    if (accountBalances['Emirates NBD CC (AED)'] !== undefined) {
        accountBalances['Emirates NBD CC (AED)'] += 15400;
    }

    dynamicProfiles.forEach(profile => {
        profile.accounts.forEach((acc, index) => {
            const el = document.getElementById(`bal-dyn-${profile.id}-${index}`);
            if (el) el.innerText = (accountBalances[acc] || 0).toFixed(2);
        });
    });

    const currentRate = (typeof exchangeRates !== 'undefined' && typeof currentSymbol !== 'undefined' && exchangeRates[currentSymbol]) || 1;
    let totalBalanceUSD = 0;
    Object.keys(accountBalances).forEach(acc => {
        const rate = acc.includes('(AED)') ? rateAED : rateINR;
        totalBalanceUSD += (accountBalances[acc] / rate);
    });
    // Savings Potential is money remaining after regular expenses and investment payments.
    const savingsUSD = totalIncomeUSD - (totalExpenseUSD - investmentUSD) - investmentUSD;

    const incEl = document.querySelector('#total-income-card [data-value]');
    const expEl = document.querySelector('#total-expense-card [data-value]');
    const balEl = document.querySelector('#balance-card [data-value]');
    const savingsEl = document.querySelector('#savings-card [data-value]');
    const topAmountEl = document.querySelector('#highest-category-card [data-value]');
    const topNameEl = document.getElementById('top-spending-category');
    const countEl = document.getElementById('transaction-count');

    if (incEl) incEl.innerText = (totalIncomeUSD * currentRate).toFixed(2);
    if (expEl) expEl.innerText = (totalExpenseUSD * currentRate).toFixed(2);
    if (balEl) balEl.innerText = (totalBalanceUSD * currentRate).toFixed(2);
    if (savingsEl) savingsEl.innerText = (savingsUSD * currentRate).toFixed(2);

    const topEntry = Object.entries(categoryTotalsUSD).sort((a, b) => b[1] - a[1])[0];
    if (topNameEl) topNameEl.innerText = topEntry ? topEntry[0] : 'No expenses';
    if (topAmountEl) topAmountEl.innerText = topEntry ? (topEntry[1] * currentRate).toFixed(2) : '0.00';

    // The count is the physical number of transactions. It never changes with currency.
    if (countEl) countEl.innerText = String(transactions.length);

    renderDashboardCharts(totalIncomeUSD, totalExpenseUSD, categoryTotalsUSD, dashboardTransactions, currentRate);
}

let dashPieChart = null;
let dashBarChart = null;
let dashLineChart = null;

function renderDashboardCharts(totalIncomeUSD, totalExpenseUSD, categoryTotalsUSD, dashboardTransactions, currentRate) {
    if (typeof Chart === 'undefined') return;

    const pieCtx = document.getElementById('expenseByCategoryChart');
    const barCtx = document.getElementById('incomeVsExpenseChart');
    const lineCtx = document.getElementById('monthlyTrendChart');
    
    if (!pieCtx || !barCtx || !lineCtx) return;

    if (dashPieChart) dashPieChart.destroy();
    if (dashBarChart) dashBarChart.destroy();
    if (dashLineChart) dashLineChart.destroy();

    const bgColors = ['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5','#70AD47','#264478','#9E480E'];

    // Pie Chart
    const catLabels = Object.keys(categoryTotalsUSD);
    const catData = Object.values(categoryTotalsUSD).map(v => v * currentRate);
    dashPieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['No Expenses'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: catData.length ? bgColors : ['#eee'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Expense by Category' },
                legend: { position: 'right' }
            }
        }
    });

    // Bar Chart
    dashBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                label: 'Amount',
                data: [totalIncomeUSD * currentRate, totalExpenseUSD * currentRate],
                backgroundColor: ['#1dd1a1', '#ff6b6b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Income vs Expense' },
                legend: { display: false }
            }
        }
    });

    // Line Chart (Daily Trend for the selected period)
    const dailyExps = {};
    const rateAED = (typeof exchangeRates !== 'undefined' && exchangeRates['AED']) || 3.67;
    const rateINR = (typeof exchangeRates !== 'undefined' && exchangeRates['₹']) || 83.50;
    
    dashboardTransactions.forEach(t => {
        if (t.type === 'Expense' && t.date) {
            if (!dailyExps[t.date]) dailyExps[t.date] = 0;
            const amtUSD = Number(t.amount||0) / (String(t.account||'').includes('(AED)') ? rateAED : rateINR);
            dailyExps[t.date] += amtUSD;
        }
    });
    const sortedDates = Object.keys(dailyExps).sort();
    const trendData = sortedDates.map(d => dailyExps[d] * currentRate);

    dashLineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: sortedDates.length ? sortedDates : ['No Data'],
            datasets: [{
                label: 'Daily Expense',
                data: trendData.length ? trendData : [0],
                borderColor: '#4472C4',
                backgroundColor: '#4472C4',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Expense Trend' },
                legend: { display: false }
            }
        }
    });
}

let pieChartInstance = null;
let barChartInstance = null;

function renderReports() {
    const reportAccSelect = document.getElementById('report-account-select');
    const reportTbody = document.getElementById('report-transaction-list');
    if (!reportAccSelect || !reportTbody) return;
    
    const selectedAcc = reportAccSelect.value;
    reportTbody.innerHTML = '';
    
    let inc = 0, exp = 0, openingOrOnhand = 0;
    let categories = {};
    let isAED = selectedAcc.includes('(AED)');
    let currency = isAED ? 'AED' : 'INR';

    getFilteredTransactions().forEach((t, i) => {
        let rowHtml = (curr, amount, badgeClass, typeText, showTo) => `
            <tr>
                <td>${escapeHTML(t.date)}</td>
                <td>${escapeHTML(t.description)}</td>
                <td>${escapeHTML(t.category)}</td>
                <td><span class="status-badge ${badgeClass}">${escapeHTML(typeText)}</span></td>
                <td>${escapeHTML(curr)} ${amount.toFixed(2)}</td>
                <td>${showTo && t.toAccount ? escapeHTML(t.toAccount.replace(/ \(.+\)/, '')) : '-'}</td>
                <td><button class="btn secondary-btn" onclick="deleteTransaction(${t.id})" style="padding:0.2rem 0.5rem; font-size:0.8rem">Delete</button></td>
            </tr>
        `;

        if (t.type === 'Transfer') {
            if (t.account === selectedAcc) {
                exp += t.amount;
                reportTbody.innerHTML += rowHtml(currency, t.amount, 'active', 'Sent Transfer', true);
            } else if (t.toAccount === selectedAcc) {
                let fromAED = t.account.includes('(AED)');
                let toAED = t.toAccount.includes('(AED)');
                let convertedAmt = t.amount;
                let rateAED = 3.67; let rateINR = 83.50;
                if (typeof exchangeRates !== 'undefined') { rateAED = exchangeRates['₹']; rateINR = exchangeRates['₹']; }
                
                if (fromAED && !toAED) convertedAmt = t.amount * (rateINR / rateAED);
                if (!fromAED && toAED) convertedAmt = t.amount * (rateAED / rateINR);
                
                inc += convertedAmt;
                reportTbody.innerHTML += rowHtml(currency, convertedAmt, 'future', 'Received Transfer', false);
            }
        } else {
            if (t.account === selectedAcc) {
                if (t.type === 'Income') {
                    if(t.category !== 'Opening Balance') inc += t.amount;
                    else openingOrOnhand += t.amount;
                    reportTbody.innerHTML += rowHtml(currency, t.amount, 'future', t.category === 'Opening Balance' ? 'Opening Balance' : 'Income', false);
                } else if (t.type === 'Onhand') {
                    openingOrOnhand += t.amount;
                    reportTbody.innerHTML += rowHtml(currency, t.amount, 'future', 'Onhand', false);
                } else if (t.type === 'Expense') {
                    if(t.category !== 'Opening Balance') {
                        exp += t.amount;
                        categories[t.category] = (categories[t.category] || 0) + t.amount;
                    } else {
                        openingOrOnhand -= t.amount;
                    }
                    reportTbody.innerHTML += rowHtml(currency, t.amount, 'active', t.category === 'Opening Balance' ? 'Opening Balance' : 'Expense', false);
                }
            }
        }
    });

    let net = inc - exp + openingOrOnhand;
    let netTitle = "Current Balance";
    let incTitle = "Total Income";
    let expTitle = "Total Expenses";
    
    const debtCard = document.getElementById('report-debt-card');
    const debtAmountSpan = document.getElementById('report-debt');
    const availCard = document.getElementById('report-available-card');
    const availAmountSpan = document.getElementById('report-available');
    
    if (selectedAcc === 'Emirates NBD CC (AED)') {
        let needToPay = -net;
        let availableLimit = 15400 + net;
        net = 15400; // This will become the "Total Limit"
        netTitle = "Total Limit";
        incTitle = "Payments Received";
        expTitle = "Total Spent";
        
        if(debtCard) debtCard.style.display = 'flex';
        if(debtAmountSpan) debtAmountSpan.innerText = currency + " " + needToPay.toFixed(2);
        
        if(availCard) availCard.style.display = 'flex';
        if(availAmountSpan) availAmountSpan.innerText = currency + " " + availableLimit.toFixed(2);
    } else {
        if(debtCard) debtCard.style.display = 'none';
        if(availCard) availCard.style.display = 'none';
    }

    document.getElementById('report-income').innerText = currency + " " + inc.toFixed(2);
    document.getElementById('report-expense').innerText = currency + " " + exp.toFixed(2);
    document.getElementById('report-net').innerText = currency + " " + net.toFixed(2);
    
    if(document.getElementById('report-net-title')) document.getElementById('report-net-title').innerText = netTitle;
    if(document.getElementById('report-income-title')) document.getElementById('report-income-title').innerText = incTitle;
    if(document.getElementById('report-expense-title')) document.getElementById('report-expense-title').innerText = expTitle;

    // Chart logic
    if (typeof Chart === 'undefined') return;
    
    const pieCtx = document.getElementById('categoryPieChart');
    const barCtx = document.getElementById('incomeExpenseBarChart');
    if (!pieCtx || !barCtx) return;

    if (pieChartInstance) pieChartInstance.destroy();
    if (barChartInstance) barChartInstance.destroy();

    const catLabels = Object.keys(categories);
    const catData = Object.values(categories);
    const bgColors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9f43', '#5f27cd', '#c8d6e5'];

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['No Data'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: catData.length ? bgColors : ['#eee'],
                borderColor: '#ffffff',
                borderWidth: 3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            }
        }
    });

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount',
                data: [inc, exp],
                backgroundColor: ['#1dd1a1', '#ff6b6b']
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// Add event listener for report dropdown
if(document.getElementById('report-account-select')) {
    document.getElementById('report-account-select').addEventListener('change', renderReports);
}

window.goToAccountReport = function(accountName) {
    // Switch active tab to Reports
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const reportsTabBtn = document.querySelector('[data-tab="tab-reports"]');
    if (reportsTabBtn) reportsTabBtn.classList.add('active');
    
    const reportsTabContent = document.getElementById('tab-reports');
    if (reportsTabContent) reportsTabContent.classList.add('active');
    
    // Set dropdown and trigger render
    const select = document.getElementById('report-account-select');
    if (select) {
        select.value = accountName;
        renderReports();
    }
}

function renderAll() {
    renderProfiles();
    populateMonthFilter();
    renderInvestments();
    renderDynamicEmis();
    renderTransactions();
    updateDashboardTotals();
    renderReports();
}
document.addEventListener('DOMContentLoaded', () => {
    setupTransactionFieldControls();

    // Fetch data from Database
    Promise.all([
        fetch('api.php?action=get_transactions').then(r => r.json()),
        fetch('api.php?action=get_investments').then(r => r.json())
    ]).then(([txs, invs]) => {
        transactions = txs.map(t => ({ ...t, amount: parseFloat(t.amount) }));
        investments = invs.length > 0 ? invs : defaultInvestments;
        renderAll();
    }).catch(err => {
        console.error("Failed to fetch database records", err);
        renderAll();
    });
});

// --- Change Password Logic ---
const cpForm = document.getElementById('change-password-form');
if (cpForm) {
    cpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const msgDiv = document.getElementById('password-msg');
        msgDiv.style.color = 'inherit';
        msgDiv.innerText = 'Updating...';
        
        const fd = new FormData();
        fd.append('current_password', document.getElementById('current_password').value);
        fd.append('new_password', document.getElementById('new_password').value);
        fd.append('confirm_password', document.getElementById('confirm_password').value);

        fetch('change_password.php', {
            method: 'POST',
            body: fd
        })
        .then(res => res.json())
        .then(data => {
            msgDiv.innerText = data.message;
            if (data.success) {
                msgDiv.style.color = 'var(--success-color)';
                cpForm.reset();
            } else {
                msgDiv.style.color = 'var(--danger-color)';
            }
        })
        .catch(err => {
            msgDiv.innerText = 'Error occurred.';
            msgDiv.style.color = 'var(--danger-color)';
        });
    });
}

// --- Sync Local Data to DB ---
const syncBtn = document.getElementById('sync-db-btn');
if(syncBtn) {
    syncBtn.addEventListener('click', () => {
        const syncMsg = document.getElementById('sync-msg');
        syncMsg.innerText = 'Syncing...';
        
        const localTxs = JSON.parse(localStorage.getItem('transactions')) || [];
        const localInvs = JSON.parse(localStorage.getItem('investments')) || defaultInvestments;
        
        Promise.all([
            fetch('api.php?action=sync_transactions', {
                method: 'POST',
                body: JSON.stringify(localTxs)
            }).then(r => r.json()),
            fetch('api.php?action=sync_investments', {
                method: 'POST',
                body: JSON.stringify(localInvs)
            }).then(r => r.json())
        ]).then(([txRes, invRes]) => {
            if(txRes.status === 'success' && invRes.status === 'success') {
                syncMsg.innerText = 'Sync Complete! Please refresh.';
                syncMsg.style.color = 'var(--success-color)';
                localStorage.removeItem('transactions');
            } else {
                syncMsg.innerText = 'Sync failed on server.';
                syncMsg.style.color = 'var(--danger-color)';
            }
        }).catch(err => {
syncMsg.innerText = 'Network error during sync.';
            syncMsg.style.color = 'var(--danger-color)';
        });
    });
}
// --- Filtering Logic ---
let currentMonthFilter = '';
let currentSearchTerm = '';

function getFilteredTransactions() {
  let filtered = transactions;
  if(currentMonthFilter) {
      filtered = filtered.filter(t => t.date && t.date.substring(0,7) === currentMonthFilter);
  }
  if(currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(t => {
          return (t.date && t.date.toLowerCase().includes(term)) ||
                 (t.type && t.type.toLowerCase().includes(term)) ||
                 (t.description && t.description.toLowerCase().includes(term)) ||
                 (t.account && t.account.toLowerCase().includes(term)) ||
                 (t.category && t.category.toLowerCase().includes(term)) ||
                 (t.amount && t.amount.toString().toLowerCase().includes(term));
      });
  }
  return filtered;
}

function populateMonthFilter() {
  const select = document.getElementById('month-filter');
  if(!select) return;
  const months = new Set();
  transactions.forEach(t => { if(t.date) months.add(t.date.substring(0,7)); });
  const sortedMonths = Array.from(months).sort().reverse();
  const currentVal = select.value || '';
  select.innerHTML = '<option value=\"\">All Months</option>';
  sortedMonths.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    const d = new Date(m + '-01');
    opt.innerText = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    select.appendChild(opt);
  });
  select.value = currentVal;
}

const monthFilterEl = document.getElementById('month-filter');
if(monthFilterEl) {
  monthFilterEl.addEventListener('change', (e) => {
    currentMonthFilter = e.target.value;
    renderAll();
  });
}

const transactionSearchEl = document.getElementById('transaction-search');
if(transactionSearchEl) {
  transactionSearchEl.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    renderAll();
  });
}

// --- Export CSV Logic ---
const exportCsvBtn = document.getElementById('exportCsvBtn');
if(exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    const txs = getFilteredTransactions();
    if(txs.length === 0) { alert('No data to export!'); return; }
    let csvContent = 'data:text/csv;charset=utf-8,ID,Date,Account,Description,Category,Type,Amount,ToAccount\n';
    txs.forEach(t => {
      const row = [t.id, t.date, '\"'+t.account+'\"', '\"'+(t.description||'')+'\"', '\"'+t.category+'\"', t.type, t.amount, '\"'+(t.toAccount||'')+'\"'].join(',');
      csvContent += row + '\r\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

const exportExcelBtn = document.getElementById('exportExcelBtn');
if(exportExcelBtn) {
  exportExcelBtn.addEventListener('click', async () => {
    if (typeof ExcelJS === 'undefined') {
        alert('ExcelJS export library is not loaded properly.');
        return;
    }
    const txs = typeof getReportTransactions === 'function' ? getReportTransactions() : getFilteredTransactions();
    if(txs.length === 0) { alert('No data to export!'); return; }
    
    // Disable button to prevent multiple clicks and show generating status
    const originalText = exportExcelBtn.innerHTML;
    exportExcelBtn.innerHTML = 'Generating...';
    exportExcelBtn.disabled = true;
    
    try {
        await generateProfessionalExcel(txs);
    } catch(e) {
        console.error("Excel generation error:", e);
        alert("Error generating Excel report.");
    } finally {
        exportExcelBtn.innerHTML = originalText;
        exportExcelBtn.disabled = false;
    }
  });
}

async function generateProfessionalExcel(txs) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    workbook.lastModifiedBy = 'Expense Tracker';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Reusable styles
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF215967' } }; // Dark blue
    const whiteFont = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
    const borderAll = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    
    // Compute common metrics
    let totalIncome = 0, totalExpenses = 0, totalTransfers = 0, totalOnhand = 0;
    const categoryTotals = {};
    const dates = [];
    txs.forEach(t => {
        const amt = Number(t.amount || 0);
        if (t.type === 'Income' || t.type === 'Onhand') { totalIncome += amt; if(t.type==='Onhand') totalOnhand+=amt; }
        else if (t.type === 'Expense') { totalExpenses += amt; categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt; }
        else if (t.type === 'Transfer') { totalTransfers += amt; }
        if (t.date) dates.push(new Date(t.date));
    });
    const netCashFlow = totalIncome - totalExpenses;
    const transactionCount = txs.length;
    let minDate = new Date(), maxDate = new Date();
    if(dates.length) { minDate = new Date(Math.min(...dates)); maxDate = new Date(Math.max(...dates)); }
    const daysCovered = dates.length ? Math.ceil(Math.abs(maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1 : 1;
    const periodStr = `Period: ${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()} | Generated: ${new Date().toLocaleDateString()}`;

    // --- TAB 1: REPORT ---
    const ws1 = workbook.addWorksheet('Report');
    ws1.columns = [
        { key: 'colA', width: 14 }, { key: 'colB', width: 25 }, { key: 'colC', width: 35 }, 
        { key: 'colD', width: 20 }, { key: 'colE', width: 12 }, { key: 'colF', width: 14 }, 
        { key: 'colG', width: 25 }, { key: 'colH', width: 20 }, { key: 'colI', width: 2 }, 
        { key: 'colJ', width: 25 }, { key: 'colK', width: 15 }
    ];

    // Main Headers
    ws1.mergeCells('A1:H1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = '📊 FINANCIAL TRANSACTIONS REPORT';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF215967' }, name: 'Calibri' };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    ws1.mergeCells('A2:H2');
    ws1.getCell('A2').value = periodStr;
    ws1.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    // Summary Box
    ws1.mergeCells('A4:B4'); ws1.getCell('A4').value = '📉 TOTAL EXPENSES';
    ws1.mergeCells('C4:D4'); ws1.getCell('C4').value = '💳 TOTAL TRANSFERS';
    ws1.mergeCells('E4:F4'); ws1.getCell('E4').value = '📊 NET CASH FLOW';
    ws1.getCell('G4').value = '📈 TXN COUNT';
    ws1.getCell('H4').value = '📅 DAYS';
    const sumHeaderRow = ws1.getRow(4);
    sumHeaderRow.eachCell({ includeEmpty: false }, cell => {
        cell.fill = headerFill; cell.font = whiteFont; cell.border = borderAll; cell.alignment = { horizontal: 'center' };
    });

    ws1.mergeCells('A5:B5'); ws1.getCell('A5').value = { formula: 'SUMIF(E9:E1048576, "Expense", F9:F1048576)' };
    ws1.mergeCells('C5:D5'); ws1.getCell('C5').value = { formula: 'SUMIF(E9:E1048576, "Transfer", F9:F1048576)' };
    ws1.mergeCells('E5:F5'); ws1.getCell('E5').value = { formula: 'SUMIF(E9:E1048576, "Income", F9:F1048576) - SUMIF(E9:E1048576, "Expense", F9:F1048576) + SUMIF(E9:E1048576, "Onhand", F9:F1048576)' };
    ws1.getCell('G5').value = { formula: 'COUNTA(A9:A1048576)' };
    ws1.getCell('H5').value = daysCovered;
    const sumValRow = ws1.getRow(5);
    sumValRow.eachCell({ includeEmpty: false }, cell => {
        cell.font = { bold: true, size: 12 }; cell.border = borderAll; cell.alignment = { horizontal: 'center' };
        if(cell.col >= 1 && cell.col <= 6 && typeof cell.value === 'number') cell.numFmt = '#,##0.00';
    });
    ws1.getCell('E5').font = { bold: true, size: 12, color: { argb: netCashFlow < 0 ? 'FFFF0000' : 'FF00B050' } };

    // Transaction Details Header
    ws1.mergeCells('A7:H7');
    ws1.getCell('A7').value = '📋 TRANSACTION DETAILS';
    ws1.getCell('A7').font = { bold: true, size: 12, color: { argb: 'FF215967' } };

    const th = ws1.getRow(8);
    th.values = ['Date', 'Account', 'Description', 'Category', 'Type', 'Amount', 'To Account', 'Notes'];
    th.eachCell((cell, col) => {
        if(col <= 8) { cell.fill = headerFill; cell.font = whiteFont; cell.border = borderAll; cell.alignment = { horizontal: 'center' }; }
    });

    let rIdx = 9;
    txs.forEach((t, i) => {
        const row = ws1.getRow(rIdx);
        row.values = [t.date, t.account, t.description, t.category, t.type, Number(t.amount||0), t.toAccount, t.notes];
        
        let rowColor = 'FFFFFFFF';
        if(t.type === 'Income') rowColor = 'FFE2EFDA'; // Light Green
        else if(t.type === 'Expense') rowColor = 'FFFCE4D6'; // Light Orange/Peach
        else if(t.type === 'Transfer') rowColor = 'FFD9E1F2'; // Light Blue
        else if(t.type === 'Onhand') rowColor = 'FFEDEDED'; // Light Gray
        
        row.eachCell((cell, col) => {
            if(col <= 8) {
                cell.border = borderAll;
                if(col === 6) cell.numFmt = '#,##0.00';
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
            }
        });
        rIdx++;
    });

    // Category Breakdown Side Panel
    ws1.mergeCells('J1:K1');
    ws1.getCell('J1').value = '📈 CATEGORY BREAKDOWN';
    ws1.getCell('J1').font = { bold: true, size: 11, color: { argb: 'FF215967' } };
    ws1.getCell('J2').value = 'Category'; ws1.getCell('K2').value = 'Total Amount';
    ws1.getRow(2).getCell('J').fill = headerFill; ws1.getRow(2).getCell('J').font = whiteFont; ws1.getRow(2).getCell('J').border = borderAll;
    ws1.getRow(2).getCell('K').fill = headerFill; ws1.getRow(2).getCell('K').font = whiteFont; ws1.getRow(2).getCell('K').border = borderAll;
    
    const sortedCats = Object.keys(categoryTotals).sort((a,b) => categoryTotals[b] - categoryTotals[a]);
    let cRIdx = 3;
    sortedCats.forEach(cat => {
        ws1.getCell(`J${cRIdx}`).value = cat; ws1.getCell(`J${cRIdx}`).border = borderAll;
        ws1.getCell(`K${cRIdx}`).value = { formula: `SUMIFS(F:F, D:D, "${cat}", E:E, "Expense")` }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00';
        cRIdx++;
    });
    ws1.getCell(`J${cRIdx}`).value = 'TOTAL EXPENSES'; ws1.getCell(`J${cRIdx}`).font = {bold:true}; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = totalExpenses; ws1.getCell(`K${cRIdx}`).font = {bold:true}; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00';

    // Account Summary Side Panel
    cRIdx += 2;
    ws1.mergeCells(`J${cRIdx}:K${cRIdx}`);
    ws1.getCell(`J${cRIdx}`).value = '🏦 ACCOUNT SUMMARY';
    ws1.getCell(`J${cRIdx}`).font = { bold: true, size: 11, color: { argb: 'FF215967' } };
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Account'; ws1.getCell(`K${cRIdx}`).value = 'Total Activity';
    ws1.getRow(cRIdx).getCell('J').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } }; ws1.getRow(cRIdx).getCell('J').font = whiteFont; ws1.getRow(cRIdx).getCell('J').border = borderAll;
    ws1.getRow(cRIdx).getCell('K').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } }; ws1.getRow(cRIdx).getCell('K').font = whiteFont; ws1.getRow(cRIdx).getCell('K').border = borderAll;
    
    const accActivity = {};
    txs.forEach(t => { 
        if(t.account) accActivity[t.account] = (accActivity[t.account] || 0) + Number(t.amount||0);
        if(t.toAccount) accActivity[t.toAccount] = (accActivity[t.toAccount] || 0) + Number(t.amount||0);
    });
    cRIdx++;
    Object.keys(accActivity).sort((a,b) => accActivity[b] - accActivity[a]).forEach(acc => {
        ws1.getCell(`J${cRIdx}`).value = acc; ws1.getCell(`J${cRIdx}`).border = borderAll;
        ws1.getCell(`K${cRIdx}`).value = { formula: `SUMIFS(F9:F1048576, B9:B1048576, "${acc}") + SUMIFS(F9:F1048576, G9:G1048576, "${acc}")` }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00';
        cRIdx++;
    });

    // Key Metrics Side Panel
    cRIdx += 2;
    ws1.mergeCells(`J${cRIdx}:K${cRIdx}`);
    ws1.getCell(`J${cRIdx}`).value = '⚡ KEY METRICS';
    ws1.getCell(`J${cRIdx}`).font = { bold: true, size: 11, color: { argb: 'FF215967' } };
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Metric'; ws1.getCell(`K${cRIdx}`).value = 'Value';
    ws1.getRow(cRIdx).getCell('J').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } }; ws1.getRow(cRIdx).getCell('J').font = whiteFont; ws1.getRow(cRIdx).getCell('J').border = borderAll;
    ws1.getRow(cRIdx).getCell('K').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } }; ws1.getRow(cRIdx).getCell('K').font = whiteFont; ws1.getRow(cRIdx).getCell('K').border = borderAll;
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Average Transaction'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'AVERAGEIF(E9:E1048576, "<>Onhand", F9:F1048576)' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Largest Expense'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'MAXIFS(F9:F1048576, E9:E1048576, "Expense")' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Smallest Expense'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'MINIFS(F9:F1048576, E9:E1048576, "Expense")' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Total Investment'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'SUMIFS(F9:F1048576, E9:E1048576, "Expense", D9:D1048576, "Investment")' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Total EMI Payments'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'SUMIFS(F9:F1048576, E9:E1048576, "Expense", D9:D1048576, "EMI")' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;
    ws1.getCell(`J${cRIdx}`).value = 'Opening Balance Total'; ws1.getCell(`J${cRIdx}`).border = borderAll;
    ws1.getCell(`K${cRIdx}`).value = { formula: 'SUMIFS(F9:F1048576, D9:D1048576, "Opening Balance")' }; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).numFmt = '#,##0.00'; ws1.getCell(`K${cRIdx}`).font = {bold:true};
    cRIdx++;

    // Color Legend
    cRIdx += 2;
    ws1.mergeCells(`J${cRIdx}:K${cRIdx}`);
    ws1.getCell(`J${cRIdx}`).value = '🎨 COLOR LEGEND';
    ws1.getCell(`J${cRIdx}`).font = { bold: true, size: 11, color: { argb: 'FF215967' } };
    cRIdx++;
    const legData = [
        ['Income', '🟢', 'FFE2EFDA'],
        ['Expense', '🔴', 'FFFCE4D6'],
        ['Transfer', '🟣', 'FFD9E1F2'],
        ['Onhand', '🔵', 'FFEDEDED']
    ];
    legData.forEach(l => {
        ws1.getCell(`J${cRIdx}`).value = l[0]; ws1.getCell(`J${cRIdx}`).border = borderAll;
        ws1.getCell(`K${cRIdx}`).value = l[1]; ws1.getCell(`K${cRIdx}`).border = borderAll; ws1.getCell(`K${cRIdx}`).alignment = {horizontal:'center'};
        ws1.getRow(cRIdx).getCell('J').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: l[2] } };
        ws1.getRow(cRIdx).getCell('K').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: l[2] } };
        cRIdx++;
    });


    // --- TAB 2: CATEGORY ANALYSIS ---
    const ws2 = workbook.addWorksheet('Category Analysis');
    ws2.columns = [
        { width: 25 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 5 },
        { width: 25 }, { width: 15 }, { width: 12 }, { width: 12 }
    ];
    
    ws2.mergeCells('A1:D1');
    ws2.getCell('A1').value = '📊 CATEGORY-WISE EXPENSE ANALYSIS';
    ws2.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF215967' } };
    ws2.mergeCells('A2:D2'); ws2.getCell('A2').value = `Detailed breakdown of spending by category | ${periodStr}`; ws2.getCell('A2').font = {italic:true, color:{argb:'FF555555'}};
    
    // Expense Categories Table
    ws2.mergeCells('A4:D4'); ws2.getCell('A4').value = '📉 EXPENSE CATEGORIES'; ws2.getCell('A4').font = {bold:true, color:{argb:'FFC00000'}};
    ws2.getCell('A5').value = 'Category'; ws2.getCell('B5').value = 'Amount'; ws2.getCell('C5').value = '% of Total'; ws2.getCell('D5').value = 'Txn Count';
    ws2.getRow(5).eachCell((cell,col)=>{if(col<=4){ cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFED7D31'}}; cell.font=whiteFont; cell.border=borderAll; }});
    
    let cr2 = 6;
    const totalCr2 = 6 + sortedCats.length;
    sortedCats.forEach(cat => {
        ws2.getCell(`A${cr2}`).value = cat;
        ws2.getCell(`B${cr2}`).value = { formula: `SUMIFS(Report!F:F, Report!D:D, "${cat}", Report!E:E, "Expense")` }; ws2.getCell(`B${cr2}`).numFmt = '#,##0.00';
        ws2.getCell(`C${cr2}`).value = { formula: `IF($B$${totalCr2}>0, B${cr2}/$B$${totalCr2}, 0)` }; ws2.getCell(`C${cr2}`).numFmt = '0.0%';
        ws2.getCell(`D${cr2}`).value = { formula: `COUNTIFS(Report!D:D, "${cat}", Report!E:E, "Expense")` };
        ws2.getRow(cr2).eachCell((cell,col)=>{if(col<=4) cell.border=borderAll;});
        cr2++;
    });
    ws2.getCell(`A${totalCr2}`).value = 'TOTAL EXPENSES'; ws2.getCell(`A${totalCr2}`).font = {bold:true};
    ws2.getCell(`B${totalCr2}`).value = { formula: 'SUMIF(Report!E:E, "Expense", Report!F:F)' }; ws2.getCell(`B${totalCr2}`).font = {bold:true}; ws2.getCell(`B${totalCr2}`).numFmt = '#,##0.00';
    ws2.getCell(`C${totalCr2}`).value = 1; ws2.getCell(`C${totalCr2}`).numFmt = '0.0%'; ws2.getCell(`C${totalCr2}`).font = {bold:true};
    ws2.getRow(cr2).eachCell((cell,col)=>{if(col<=4) cell.border=borderAll;});

    // --- INCOME CATEGORIES TABLE ---
    ws2.mergeCells('F4:H4'); ws2.getCell('F4').value = '💰 INCOME CATEGORIES'; ws2.getCell('F4').font = {bold:true, color:{argb:'FF548235'}};
    ws2.getCell('F5').value = 'Category'; ws2.getCell('G5').value = 'Amount'; ws2.getCell('H5').value = 'Txn Count';
    ws2.getRow(5).eachCell((cell,col)=>{if(col>=6 && col<=8){ cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF548235'}}; cell.font=whiteFont; cell.border=borderAll; }});
    
    let icr = 6;
    const incCats = [...new Set(txs.filter(t=>t.type==='Income'||t.type==='Onhand').map(t=>t.category))];
    const totalIcr = 6 + incCats.length;
    incCats.forEach(cat => {
        ws2.getCell(`F${icr}`).value = cat;
        ws2.getCell(`G${icr}`).value = { formula: `SUMIFS(Report!F:F, Report!D:D, "${cat}", Report!E:E, "Income") + SUMIFS(Report!F:F, Report!D:D, "${cat}", Report!E:E, "Onhand")` }; ws2.getCell(`G${icr}`).numFmt = '#,##0.00';
        ws2.getCell(`H${icr}`).value = { formula: `COUNTIFS(Report!D:D, "${cat}", Report!E:E, "Income") + COUNTIFS(Report!D:D, "${cat}", Report!E:E, "Onhand")` };
        ws2.getRow(icr).eachCell((cell,col)=>{if(col>=6 && col<=8) cell.border=borderAll;});
        icr++;
    });
    ws2.getCell(`F${totalIcr}`).value = 'TOTAL INCOME'; ws2.getCell(`F${totalIcr}`).font = {bold:true};
    ws2.getCell(`G${totalIcr}`).value = { formula: 'SUMIF(Report!E:E, "Income", Report!F:F) + SUMIF(Report!E:E, "Onhand", Report!F:F)' }; ws2.getCell(`G${totalIcr}`).font = {bold:true}; ws2.getCell(`G${totalIcr}`).numFmt = '#,##0.00';
    ws2.getCell(`H${totalIcr}`).value = { formula: 'COUNTIF(Report!E:E, "Income") + COUNTIF(Report!E:E, "Onhand")' }; ws2.getCell(`H${totalIcr}`).font = {bold:true};
    ws2.getRow(totalIcr).eachCell((cell,col)=>{if(col>=6 && col<=8) cell.border=borderAll;});

    // --- TRANSACTION TYPE SUMMARY ---
    let tr2 = 21;
    ws2.mergeCells(`A${tr2}:D${tr2}`); ws2.getCell(`A${tr2}`).value = '🧾 TRANSACTION TYPE SUMMARY'; ws2.getCell(`A${tr2}`).font = {bold:true, color:{argb:'FF2F75B5'}};
    tr2++;
    ws2.getCell(`A${tr2}`).value = 'Type'; ws2.getCell(`B${tr2}`).value = 'Amount'; ws2.getCell(`C${tr2}`).value = '% of Total'; ws2.getCell(`D${tr2}`).value = 'Count';
    ws2.getRow(tr2).eachCell((cell,col)=>{if(col<=4){ cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2F75B5'}}; cell.font=whiteFont; cell.border=borderAll; }});
    tr2++;
    const types = ['Income', 'Expense', 'Transfer', 'Onhand'];
    const totalTr2 = tr2 + 4;
    types.forEach(type => {
        ws2.getCell(`A${tr2}`).value = type;
        ws2.getCell(`B${tr2}`).value = { formula: `SUMIFS(Report!F:F, Report!E:E, "${type}")` }; ws2.getCell(`B${tr2}`).numFmt = '#,##0.00';
        ws2.getCell(`C${tr2}`).value = { formula: `IF($B$${totalTr2}>0, B${tr2}/$B$${totalTr2}, 0)` }; ws2.getCell(`C${tr2}`).numFmt = '0.0%';
        ws2.getCell(`D${tr2}`).value = { formula: `COUNTIFS(Report!E:E, "${type}")` };
        ws2.getRow(tr2).eachCell((cell,col)=>{if(col<=4) cell.border=borderAll;});
        tr2++;
    });
    ws2.getCell(`A${totalTr2}`).value = 'GRAND TOTAL'; ws2.getCell(`A${totalTr2}`).font = {bold:true};
    ws2.getCell(`B${totalTr2}`).value = { formula: `SUM(B${totalTr2-4}:B${totalTr2-1})` }; ws2.getCell(`B${totalTr2}`).font = {bold:true}; ws2.getCell(`B${totalTr2}`).numFmt = '#,##0.00';
    ws2.getCell(`C${totalTr2}`).value = 1; ws2.getCell(`C${totalTr2}`).numFmt = '0.0%'; ws2.getCell(`C${totalTr2}`).font = {bold:true};
    ws2.getCell(`D${totalTr2}`).value = { formula: `SUM(D${totalTr2-4}:D${totalTr2-1})` }; ws2.getCell(`D${totalTr2}`).font = {bold:true};
    ws2.getRow(totalTr2).eachCell((cell,col)=>{if(col<=4) cell.border=borderAll;});

    // --- TOP 5 EXPENSE CATEGORIES ---
    let topR = 21;
    ws2.mergeCells(`F${topR}:G${topR}`); ws2.getCell(`F${topR}`).value = '🏆 TOP 5 EXPENSE CATEGORIES'; ws2.getCell(`F${topR}`).font = {bold:true, color:{argb:'FF7030A0'}};
    topR++;
    ws2.getCell(`F${topR}`).value = 'Category'; ws2.getCell(`G${topR}`).value = 'Amount';
    ws2.getRow(topR).eachCell((cell,col)=>{if(col>=6 && col<=7){ cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF7030A0'}}; cell.font=whiteFont; cell.border=borderAll; }});
    topR++;
    const top5Cats = sortedCats.slice(0, 5);
    top5Cats.forEach(cat => {
        ws2.getCell(`F${topR}`).value = cat;
        ws2.getCell(`G${topR}`).value = { formula: `SUMIFS(Report!F:F, Report!D:D, "${cat}", Report!E:E, "Expense")` }; ws2.getCell(`G${topR}`).numFmt = '#,##0.00';
        ws2.getRow(topR).eachCell((cell,col)=>{if(col>=6 && col<=7) cell.border=borderAll;});
        topR++;
    });

    // --- INCOME vs EXPENSE COMP ---
    let ieR = 30;
    ws2.mergeCells(`A${ieR}:B${ieR}`); ws2.getCell(`A${ieR}`).value = '⚖️ INCOME vs EXPENSE COMP'; ws2.getCell(`A${ieR}`).font = {bold:true, color:{argb:'FF215967'}};
    ieR++;
    ws2.getCell(`A${ieR}`).value = 'Type'; ws2.getCell(`B${ieR}`).value = 'Amount';
    ws2.getRow(ieR).eachCell((cell,col)=>{if(col<=2){ cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF215967'}}; cell.font=whiteFont; cell.border=borderAll; }});
    ieR++;
    ws2.getCell(`A${ieR}`).value = 'Total Income'; ws2.getCell(`B${ieR}`).value = { formula: 'G'+totalIcr }; ws2.getCell(`B${ieR}`).numFmt = '#,##0.00';
    ws2.getRow(ieR).eachCell((cell,col)=>{if(col<=2) cell.border=borderAll;});
    ieR++;
    ws2.getCell(`A${ieR}`).value = 'Total Expenses'; ws2.getCell(`B${ieR}`).value = { formula: 'B'+totalCr2 }; ws2.getCell(`B${ieR}`).numFmt = '#,##0.00';
    ws2.getRow(ieR).eachCell((cell,col)=>{if(col<=2) cell.border=borderAll;});
    ieR++;
    ws2.getCell(`A${ieR}`).value = 'Net Cash Flow'; ws2.getCell(`B${ieR}`).value = { formula: `B${ieR-2}-B${ieR-1}` }; ws2.getCell(`B${ieR}`).font = {bold:true}; ws2.getCell(`B${ieR}`).numFmt = '#,##0.00';
    ws2.getRow(ieR).eachCell((cell,col)=>{if(col<=2) cell.border=borderAll;});

    // --- DYNAMIC CHARTS FOR TAB 2 ---
    try {
        if(typeof Chart !== 'undefined') {
            const chartContainer2 = document.createElement('div');
            chartContainer2.style.width = '600px'; chartContainer2.style.height = '400px';
            chartContainer2.style.position = 'absolute'; chartContainer2.style.left = '-9999px';
            document.body.appendChild(chartContainer2);

            const whiteBgPlugin = {
                id: 'customCanvasBackgroundColor',
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            };

            // 1. Expense Distribution by Category (Pie)
            const pCtx = document.createElement('canvas'); chartContainer2.appendChild(pCtx);
            const pChart = new Chart(pCtx, {
                type: 'pie',
                data: {
                    labels: sortedCats,
                    datasets: [{
                        data: sortedCats.map(c => categoryTotals[c]),
                        backgroundColor: ['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5','#70AD47','#264478','#9E480E','#636363','#997300']
                    }]
                },
                options: { animation: false, plugins: { title: {display: true, text: 'Expense Distribution by Category'}, legend: {position: 'right'}, datalabels: { display: true, color: '#fff', font: {weight:'bold', size:11}, formatter: (value, ctx) => { const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0); const pct = ((value/total)*100).toFixed(0); return pct > 3 ? pct+'%' : ''; } } } },
                plugins: [whiteBgPlugin]
            });
            const pData = pChart.toBase64Image();
            const pId = workbook.addImage({ base64: pData, extension: 'png' });
            ws2.addImage(pId, { tl: { col: 9, row: 3 }, ext: { width: 500, height: 320 } });

            // 2. Amount by Transaction Type (Horizontal Bar)
            const typeTotals = { 'Income':0, 'Expense':0, 'Transfer':0, 'Onhand':0 };
            txs.forEach(t => { if(typeTotals[t.type]!==undefined) typeTotals[t.type]+=Number(t.amount||0); });
            const bCtx = document.createElement('canvas'); chartContainer2.appendChild(bCtx);
            const bChart = new Chart(bCtx, {
                type: 'bar',
                data: {
                    labels: ['Onhand', 'Transfer', 'Expense', 'Income'],
                    datasets: [{
                        data: [typeTotals['Onhand'], typeTotals['Transfer'], typeTotals['Expense'], typeTotals['Income']],
                        backgroundColor: '#5B9BD5'
                    }]
                },
                options: { animation: false, indexAxis: 'y', plugins: { title: {display: true, text: 'Amount by Transaction Type'}, legend: {display:false}, datalabels: { display: true, anchor: 'end', align: 'right', color: '#333', font: {weight:'bold', size:11}, formatter: (value) => value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) } } },
                plugins: [whiteBgPlugin]
            });
            const bData = bChart.toBase64Image();
            const bId = workbook.addImage({ base64: bData, extension: 'png' });
            ws2.addImage(bId, { tl: { col: 9, row: 20 }, ext: { width: 500, height: 320 } });

            // 3. Doughnut Income vs Expense
            const dCtx = document.createElement('canvas'); dCtx.width=400; dCtx.height=300; chartContainer2.appendChild(dCtx);
            const dChart = new Chart(dCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Total Income', 'Total Expenses'],
                    datasets: [{
                        data: [typeTotals['Income']+typeTotals['Onhand'], typeTotals['Expense']],
                        backgroundColor: ['#5B9BD5', '#C0504D']
                    }]
                },
                options: { animation: false, cutout: '70%', plugins: { title: {display: true, text: 'Income vs Expenses'}, legend: {position: 'bottom'}, datalabels: { display: true, color: '#fff', font: {weight:'bold', size:12}, formatter: (value) => value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) } } },
                plugins: [whiteBgPlugin]
            });
            const dData = dChart.toBase64Image();
            const dId = workbook.addImage({ base64: dData, extension: 'png' });
            ws2.addImage(dId, { tl: { col: 3, row: 29 }, ext: { width: 350, height: 250 } });

            // 4. Top 5 Expenses (Vertical Bar)
            const tCtx = document.createElement('canvas'); chartContainer2.appendChild(tCtx);
            const tChart = new Chart(tCtx, {
                type: 'bar',
                data: {
                    labels: top5Cats,
                    datasets: [{
                        data: top5Cats.map(c => categoryTotals[c]),
                        backgroundColor: '#7030A0'
                    }]
                },
                options: { animation: false, plugins: { title: {display: true, text: 'Top 5 Expense Categories'}, legend: {display:false}, datalabels: { display: true, anchor: 'end', align: 'top', color: '#333', font: {weight:'bold', size:11}, formatter: (value) => value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) } } },
                plugins: [whiteBgPlugin]
            });
            const tData = tChart.toBase64Image();
            const tId = workbook.addImage({ base64: tData, extension: 'png' });
            ws2.addImage(tId, { tl: { col: 9, row: 40 }, ext: { width: 500, height: 320 } });

            document.body.removeChild(chartContainer2);
        }
    } catch(e) { console.error("Could not capture dynamic charts", e); }


    // --- TAB 3: CURRENCY ANALYSIS ---
    const ws3 = workbook.addWorksheet('Currency Analysis');
    ws3.columns = [ { width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 3 }, { width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 3 }, { width: 22 }, { width: 15 }, { width: 15 }, { width: 15 } ];
    ws3.mergeCells('A1:N1'); ws3.getCell('A1').value = '💱 MULTI-CURRENCY FINANCIAL ANALYSIS REPORT';
    ws3.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF215967' } }; ws3.getCell('A1').alignment = {horizontal:'center'};
    ws3.mergeCells('A2:N2'); ws3.getCell('A2').value = `Dual Currency Analysis: AED (UAE Dirham) & INR (Indian Rupee) | ${periodStr}`; ws3.getCell('A2').font = {italic:true, color:{argb:'FF555555'}}; ws3.getCell('A2').alignment = {horizontal:'center'};

    ws3.mergeCells('A4:D4'); ws3.getCell('A4').value = '🇦🇪 AED TRANSACTIONS (UAE Dirham)';
    ws3.getCell('A4').fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF00B050'}}; ws3.getCell('A4').font = whiteFont; ws3.getCell('A4').alignment={horizontal:'center'};
    ws3.mergeCells('F4:I4'); ws3.getCell('F4').value = '🇮🇳 INR TRANSACTIONS (Indian Rupee)';
    ws3.getCell('F4').fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFED7D31'}}; ws3.getCell('F4').font = whiteFont; ws3.getCell('F4').alignment={horizontal:'center'};

    let aedInc=0, aedExp=0, aedTrx=0, inrInc=0, inrExp=0, inrTrx=0;
    let aedTxCount=0, inrTxCount=0;
    const aedCats={}, inrCats={};
    txs.forEach(t => {
        const isAED = String(t.account).includes('AED') || String(t.toAccount).includes('AED');
        const isINR = String(t.account).includes('INR') || String(t.toAccount).includes('INR');
        const amt = Number(t.amount||0);
        if(isAED) { aedTxCount++; if(t.type==='Income'||t.type==='Onhand') aedInc+=amt; else if(t.type==='Expense'){aedExp+=amt; aedCats[t.category]=(aedCats[t.category]||0)+amt;} else if(t.type==='Transfer') aedTrx+=amt; }
        if(isINR) { inrTxCount++; if(t.type==='Income'||t.type==='Onhand') inrInc+=amt; else if(t.type==='Expense'){inrExp+=amt; inrCats[t.category]=(inrCats[t.category]||0)+amt;} else if(t.type==='Transfer') inrTrx+=amt; }
    });

    ws3.getCell('A5').value='Metric'; ws3.getCell('B5').value='Amount (AED)';
    [ws3.getRow(5).getCell('A'),ws3.getRow(5).getCell('B')].forEach(c=>{c.fill=headerFill;c.font=whiteFont;c.border=borderAll;});
    ws3.getCell('F5').value='Metric'; ws3.getCell('G5').value='Amount (INR)';
    [ws3.getRow(5).getCell('F'),ws3.getRow(5).getCell('G')].forEach(c=>{c.fill=headerFill;c.font=whiteFont;c.border=borderAll;});

    const aedM=[['Total Income','SUMIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Income")'],['Total Expenses','SUMIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Expense")'],['Total Transfers','SUMIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Transfer")'],['Opening Balance','SUMIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Onhand")'],['Net Cash Flow','B6-B7'],['Transaction Count','COUNTIFS(Report!B:B,"*AED*")']];
    const inrM=[['Total Income','SUMIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Income")'],['Total Expenses','SUMIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Expense")'],['Total Transfers','SUMIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Transfer")'],['Opening Balance','SUMIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Onhand")'],['Net Cash Flow','G6-G7'],['Transaction Count','COUNTIFS(Report!B:B,"*INR*")']];
    aedM.forEach((m,i)=>{const r=6+i;ws3.getCell(`A${r}`).value=m[0];ws3.getCell(`A${r}`).border=borderAll;ws3.getCell(`B${r}`).value={formula:m[1]};ws3.getCell(`B${r}`).numFmt='#,##0.00';ws3.getCell(`B${r}`).border=borderAll;if(m[0]==='Net Cash Flow')ws3.getCell(`B${r}`).font={bold:true};});
    inrM.forEach((m,i)=>{const r=6+i;ws3.getCell(`F${r}`).value=m[0];ws3.getCell(`F${r}`).border=borderAll;ws3.getCell(`G${r}`).value={formula:m[1]};ws3.getCell(`G${r}`).numFmt='#,##0.00';ws3.getCell(`G${r}`).border=borderAll;if(m[0]==='Net Cash Flow')ws3.getCell(`G${r}`).font={bold:true};});

    // AED Categories
    ws3.getCell('A13').value='📉 AED EXPENSES BY CATEGORY';ws3.getCell('A13').font={bold:true,color:{argb:'FF00B050'}};
    ws3.getCell('A14').value='Category';ws3.getCell('B14').value='Amount (AED)';ws3.getCell('C14').value='Count';
    ['A','B','C'].forEach(c=>{ws3.getRow(14).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF00B050'}};ws3.getRow(14).getCell(c).font=whiteFont;ws3.getRow(14).getCell(c).border=borderAll;});
    let aR=15;
    Object.keys(aedCats).sort((a,b)=>aedCats[b]-aedCats[a]).forEach(cat=>{ws3.getCell(`A${aR}`).value=cat;ws3.getCell(`B${aR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Expense",Report!D:D,"${cat}")`};ws3.getCell(`B${aR}`).numFmt='#,##0.00';ws3.getCell(`C${aR}`).value={formula:`COUNTIFS(Report!B:B,"*AED*",Report!E:E,"Expense",Report!D:D,"${cat}")`};['A','B','C'].forEach(c=>ws3.getCell(`${c}${aR}`).border=borderAll);aR++;});
    ws3.getCell(`A${aR}`).value='TOTAL';ws3.getCell(`A${aR}`).font={bold:true};ws3.getCell(`B${aR}`).value={formula:`SUM(B15:B${aR-1})`};ws3.getCell(`B${aR}`).font={bold:true};ws3.getCell(`B${aR}`).numFmt='#,##0.00';ws3.getCell(`C${aR}`).value={formula:`SUM(C15:C${aR-1})`};ws3.getCell(`C${aR}`).font={bold:true};['A','B','C'].forEach(c=>ws3.getCell(`${c}${aR}`).border=borderAll);aR++;

    // INR Categories
    ws3.getCell('F13').value='📉 INR EXPENSES BY CATEGORY';ws3.getCell('F13').font={bold:true,color:{argb:'FFED7D31'}};
    ws3.getCell('F14').value='Category';ws3.getCell('G14').value='Amount (INR)';ws3.getCell('H14').value='Count';
    ['F','G','H'].forEach(c=>{ws3.getRow(14).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFED7D31'}};ws3.getRow(14).getCell(c).font=whiteFont;ws3.getRow(14).getCell(c).border=borderAll;});
    let iR=15;
    Object.keys(inrCats).sort((a,b)=>inrCats[b]-inrCats[a]).forEach(cat=>{ws3.getCell(`F${iR}`).value=cat;ws3.getCell(`G${iR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Expense",Report!D:D,"${cat}")`};ws3.getCell(`G${iR}`).numFmt='#,##0.00';ws3.getCell(`H${iR}`).value={formula:`COUNTIFS(Report!B:B,"*INR*",Report!E:E,"Expense",Report!D:D,"${cat}")`};['F','G','H'].forEach(c=>ws3.getCell(`${c}${iR}`).border=borderAll);iR++;});
    ws3.getCell(`F${iR}`).value='TOTAL';ws3.getCell(`F${iR}`).font={bold:true};ws3.getCell(`G${iR}`).value={formula:`SUM(G15:G${iR-1})`};ws3.getCell(`G${iR}`).font={bold:true};ws3.getCell(`G${iR}`).numFmt='#,##0.00';ws3.getCell(`H${iR}`).value={formula:`SUM(H15:H${iR-1})`};ws3.getCell(`H${iR}`).font={bold:true};['F','G','H'].forEach(c=>ws3.getCell(`${c}${iR}`).border=borderAll);iR++;

    // AED Accounts
    aR+=2;ws3.getCell(`A${aR}`).value='🏦 AED ACCOUNTS';ws3.getCell(`A${aR}`).font={bold:true,color:{argb:'FF00B050'}};aR++;
    ws3.getCell(`A${aR}`).value='Account';ws3.getCell(`B${aR}`).value='Income';ws3.getCell(`C${aR}`).value='Expenses';ws3.getCell(`D${aR}`).value='Balance';
    ['A','B','C','D'].forEach(c=>{ws3.getRow(aR).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF00B050'}};ws3.getRow(aR).getCell(c).font=whiteFont;ws3.getRow(aR).getCell(c).border=borderAll;});aR++;
    const aedAccs=[...new Set(txs.filter(t=>String(t.account).includes('AED')||String(t.toAccount).includes('AED')).map(t=>String(t.account).includes('AED')?t.account:t.toAccount))];
    const aedAccStartR=aR;
    aedAccs.forEach(acc=>{ws3.getCell(`A${aR}`).value=acc;ws3.getCell(`B${aR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Income")+SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Onhand")+SUMIFS(Report!F:F,Report!G:G,"${acc}",Report!E:E,"Transfer")`};ws3.getCell(`B${aR}`).numFmt='#,##0.00';ws3.getCell(`C${aR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Expense")+SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Transfer")`};ws3.getCell(`C${aR}`).numFmt='#,##0.00';ws3.getCell(`D${aR}`).value={formula:`B${aR}-C${aR}`};ws3.getCell(`D${aR}`).numFmt='#,##0.00';['A','B','C','D'].forEach(c=>ws3.getCell(`${c}${aR}`).border=borderAll);aR++;});
    ws3.getCell(`A${aR}`).value='TOTAL AED';ws3.getCell(`A${aR}`).font={bold:true};ws3.getCell(`B${aR}`).value={formula:`SUM(B${aedAccStartR}:B${aR-1})`};ws3.getCell(`B${aR}`).font={bold:true};ws3.getCell(`B${aR}`).numFmt='#,##0.00';ws3.getCell(`C${aR}`).value={formula:`SUM(C${aedAccStartR}:C${aR-1})`};ws3.getCell(`C${aR}`).font={bold:true};ws3.getCell(`C${aR}`).numFmt='#,##0.00';ws3.getCell(`D${aR}`).value={formula:`SUM(D${aedAccStartR}:D${aR-1})`};ws3.getCell(`D${aR}`).font={bold:true};ws3.getCell(`D${aR}`).numFmt='#,##0.00';['A','B','C','D'].forEach(c=>ws3.getCell(`${c}${aR}`).border=borderAll);

    // INR Accounts
    let iAccR=iR+2;ws3.getCell(`F${iAccR}`).value='🏦 INR ACCOUNTS';ws3.getCell(`F${iAccR}`).font={bold:true,color:{argb:'FFED7D31'}};iAccR++;
    ws3.getCell(`F${iAccR}`).value='Account';ws3.getCell(`G${iAccR}`).value='Income';ws3.getCell(`H${iAccR}`).value='Expenses';ws3.getCell(`I${iAccR}`).value='Balance';
    ['F','G','H','I'].forEach(c=>{ws3.getRow(iAccR).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFED7D31'}};ws3.getRow(iAccR).getCell(c).font=whiteFont;ws3.getRow(iAccR).getCell(c).border=borderAll;});iAccR++;
    const inrAccs=[...new Set(txs.filter(t=>String(t.account).includes('INR')||String(t.toAccount).includes('INR')).map(t=>String(t.account).includes('INR')?t.account:t.toAccount))];
    const inrAccStartR=iAccR;
    inrAccs.forEach(acc=>{ws3.getCell(`F${iAccR}`).value=acc;ws3.getCell(`G${iAccR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Income")+SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Onhand")+SUMIFS(Report!F:F,Report!G:G,"${acc}",Report!E:E,"Transfer")`};ws3.getCell(`G${iAccR}`).numFmt='#,##0.00';ws3.getCell(`H${iAccR}`).value={formula:`SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Expense")+SUMIFS(Report!F:F,Report!B:B,"${acc}",Report!E:E,"Transfer")`};ws3.getCell(`H${iAccR}`).numFmt='#,##0.00';ws3.getCell(`I${iAccR}`).value={formula:`G${iAccR}-H${iAccR}`};ws3.getCell(`I${iAccR}`).numFmt='#,##0.00';['F','G','H','I'].forEach(c=>ws3.getCell(`${c}${iAccR}`).border=borderAll);iAccR++;});
    ws3.getCell(`F${iAccR}`).value='TOTAL INR';ws3.getCell(`F${iAccR}`).font={bold:true};ws3.getCell(`G${iAccR}`).value={formula:`SUM(G${inrAccStartR}:G${iAccR-1})`};ws3.getCell(`G${iAccR}`).font={bold:true};ws3.getCell(`G${iAccR}`).numFmt='#,##0.00';ws3.getCell(`H${iAccR}`).value={formula:`SUM(H${inrAccStartR}:H${iAccR-1})`};ws3.getCell(`H${iAccR}`).font={bold:true};ws3.getCell(`H${iAccR}`).numFmt='#,##0.00';ws3.getCell(`I${iAccR}`).value={formula:`SUM(I${inrAccStartR}:I${iAccR-1})`};ws3.getCell(`I${iAccR}`).font={bold:true};ws3.getCell(`I${iAccR}`).numFmt='#,##0.00';['F','G','H','I'].forEach(c=>ws3.getCell(`${c}${iAccR}`).border=borderAll);

    // Key Insights
    let kR=13;ws3.getCell(`K${kR}`).value='💡 KEY INSIGHTS';ws3.getCell(`K${kR}`).font={bold:true,color:{argb:'FF7030A0'}};kR++;
    ws3.getCell(`K${kR}`).value='Insight';ws3.getCell(`L${kR}`).value='AED';ws3.getCell(`M${kR}`).value='INR';
    ['K','L','M'].forEach(c=>{ws3.getRow(kR).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF7030A0'}};ws3.getRow(kR).getCell(c).font=whiteFont;ws3.getRow(kR).getCell(c).border=borderAll;});kR++;

    // Calculate insights in JS (MAXIFS/MINIFS not supported in all Excel versions)
    const aedExpAmts = txs.filter(t=>t.type==='Expense' && (String(t.account).includes('AED')||String(t.toAccount).includes('AED'))).map(t=>Number(t.amount||0));
    const inrExpAmts = txs.filter(t=>t.type==='Expense' && (String(t.account).includes('INR')||String(t.toAccount).includes('INR'))).map(t=>Number(t.amount||0));
    const aedMax = aedExpAmts.length ? Math.max(...aedExpAmts) : 0;
    const inrMax = inrExpAmts.length ? Math.max(...inrExpAmts) : 0;
    const aedMin = aedExpAmts.length ? Math.min(...aedExpAmts) : 0;
    const inrMin = inrExpAmts.length ? Math.min(...inrExpAmts) : 0;

    const insightRows = [
        ['Largest Single Expense', aedMax, inrMax],
        ['Average Expense', {formula:'AVERAGEIFS(Report!F:F,Report!B:B,"*AED*",Report!E:E,"Expense")'}, {formula:'AVERAGEIFS(Report!F:F,Report!B:B,"*INR*",Report!E:E,"Expense")'}],
        ['Smallest Expense', aedMin, inrMin],
        ['Expense Count', {formula:'COUNTIFS(Report!B:B,"*AED*",Report!E:E,"Expense")'}, {formula:'COUNTIFS(Report!B:B,"*INR*",Report!E:E,"Expense")'}],
        ['Total Transactions', {formula:'COUNTIFS(Report!B:B,"*AED*")'}, {formula:'COUNTIFS(Report!B:B,"*INR*")'}]
    ];
    insightRows.forEach(row=>{ws3.getCell(`K${kR}`).value=row[0];ws3.getCell(`K${kR}`).border=borderAll;ws3.getCell(`L${kR}`).value=row[1];ws3.getCell(`L${kR}`).numFmt='#,##0.00';ws3.getCell(`L${kR}`).border=borderAll;ws3.getCell(`M${kR}`).value=row[2];ws3.getCell(`M${kR}`).numFmt='#,##0.00';ws3.getCell(`M${kR}`).border=borderAll;kR++;});

    // Daily Expense Trend
    kR+=2;ws3.getCell(`K${kR}`).value='📅 DAILY EXPENSE TREND';ws3.getCell(`K${kR}`).font={bold:true,color:{argb:'FF2F75B5'}};kR++;
    ws3.getCell(`K${kR}`).value='Date';ws3.getCell(`L${kR}`).value='AED Expense';ws3.getCell(`M${kR}`).value='INR Expense';
    ['K','L','M'].forEach(c=>{ws3.getRow(kR).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2F75B5'}};ws3.getRow(kR).getCell(c).font=whiteFont;ws3.getRow(kR).getCell(c).border=borderAll;});kR++;
    const dailyExps={};txs.forEach(t=>{if(t.type==='Expense'&&t.date){if(!dailyExps[t.date])dailyExps[t.date]={aed:0,inr:0};if(String(t.account).includes('AED')||String(t.toAccount).includes('AED'))dailyExps[t.date].aed+=Number(t.amount||0);if(String(t.account).includes('INR')||String(t.toAccount).includes('INR'))dailyExps[t.date].inr+=Number(t.amount||0);}});
    const sortedDates=Object.keys(dailyExps).sort();const dailyStartR=kR;
    sortedDates.forEach(date=>{ws3.getCell(`K${kR}`).value=date;ws3.getCell(`K${kR}`).border=borderAll;ws3.getCell(`L${kR}`).value={formula:`SUMIFS(Report!F:F,Report!A:A,"${date}",Report!B:B,"*AED*",Report!E:E,"Expense")`};ws3.getCell(`L${kR}`).numFmt='#,##0.00';ws3.getCell(`L${kR}`).border=borderAll;ws3.getCell(`M${kR}`).value={formula:`SUMIFS(Report!F:F,Report!A:A,"${date}",Report!B:B,"*INR*",Report!E:E,"Expense")`};ws3.getCell(`M${kR}`).numFmt='#,##0.00';ws3.getCell(`M${kR}`).border=borderAll;kR++;});
    ws3.getCell(`K${kR}`).value='TOTAL';ws3.getCell(`K${kR}`).font={bold:true};ws3.getCell(`K${kR}`).border=borderAll;ws3.getCell(`L${kR}`).value={formula:`SUM(L${dailyStartR}:L${kR-1})`};ws3.getCell(`L${kR}`).font={bold:true};ws3.getCell(`L${kR}`).numFmt='#,##0.00';ws3.getCell(`L${kR}`).border=borderAll;ws3.getCell(`M${kR}`).value={formula:`SUM(M${dailyStartR}:M${kR-1})`};ws3.getCell(`M${kR}`).font={bold:true};ws3.getCell(`M${kR}`).numFmt='#,##0.00';ws3.getCell(`M${kR}`).border=borderAll;
    const finalDR=kR;

    // Currency Comparison - position right after the AED pie chart or INR accounts, whichever is lower
    const aedPieEndR = aR + 15; // AED pie is placed at aR+2, ~13 rows tall
    const compStartR=Math.max(aedPieEndR, iAccR) + 2;let compR=compStartR;
    ws3.getCell(`A${compR}`).value='💱 CURRENCY COMPARISON';ws3.getCell(`A${compR}`).font={bold:true,color:{argb:'FF215967'}};compR++;
    ws3.getCell(`A${compR}`).value='Metric';ws3.getCell(`B${compR}`).value='AED';ws3.getCell(`C${compR}`).value='INR';
    ['A','B','C'].forEach(c=>{ws3.getRow(compR).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF215967'}};ws3.getRow(compR).getCell(c).font=whiteFont;ws3.getRow(compR).getCell(c).border=borderAll;});compR++;
    [['Total Income',{formula:'B6'},{formula:'G6'}],['Total Expenses',{formula:'B7'},{formula:'G7'}],['Opening Balance',{formula:'B9'},{formula:'G9'}],['Net Cash Flow',{formula:'B10'},{formula:'G10'}],['Transaction Count',{formula:'B11'},{formula:'G11'}]].forEach(row=>{ws3.getCell(`A${compR}`).value=row[0];ws3.getCell(`B${compR}`).value=row[1];ws3.getCell(`B${compR}`).numFmt='#,##0.00';ws3.getCell(`C${compR}`).value=row[2];ws3.getCell(`C${compR}`).numFmt='#,##0.00';['A','B','C'].forEach(c=>ws3.getCell(`${c}${compR}`).border=borderAll);compR++;});

    // Generate Charts
    let generatedBarData=null,generatedLineData=null,aedPieData=null,inrPieData=null;
    try{if(typeof Chart!=='undefined'){
    const chartContainer=document.createElement('div');chartContainer.style.width='600px';chartContainer.style.height='400px';chartContainer.style.position='absolute';chartContainer.style.left='-9999px';document.body.appendChild(chartContainer);
    const whiteBgPlugin={id:'bg',beforeDraw:(chart)=>{const ctx=chart.ctx;ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='white';ctx.fillRect(0,0,chart.width,chart.height);ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#d9d9d9';ctx.lineWidth=1;ctx.strokeRect(0,0,chart.width,chart.height);ctx.restore();}};
    const pieColors=['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5','#70AD47','#264478','#9E480E','#636363','#997300','#C0504D','#4BACC6'];
    const aedPL=Object.keys(aedCats).sort((a,b)=>aedCats[b]-aedCats[a]);const inrPL=Object.keys(inrCats).sort((a,b)=>inrCats[b]-inrCats[a]);

    const pieLabelFormatter = (v,ctx)=>{const t=ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);const p=((v/t)*100).toFixed(0);if(p<3)return'';const curr=ctx.chart.options.plugins.title.text.includes('AED')?'AED ':'₹';return `${curr}${v.toLocaleString('en-US',{minimumFractionDigits:2})}, ${p}%`;};

    const c1=document.createElement('canvas');c1.width=500;c1.height=400;chartContainer.appendChild(c1);
    const ap=new Chart(c1,{type:'pie',data:{labels:aedPL,datasets:[{data:aedPL.map(c=>aedCats[c]),backgroundColor:pieColors}]},options:{animation:false,layout:{padding:40},plugins:{title:{display:true,text:'AED Expense Distribution'},legend:{position:'bottom',labels:{font:{size:9}}},datalabels:{display:true,color:'#333',anchor:'end',align:'end',offset:5,font:{size:9},formatter:pieLabelFormatter}}},plugins:[whiteBgPlugin]});aedPieData=ap.toBase64Image();ap.destroy();

    const c2=document.createElement('canvas');c2.width=600;c2.height=400;chartContainer.appendChild(c2);
    const ip=new Chart(c2,{type:'pie',data:{labels:inrPL,datasets:[{data:inrPL.map(c=>inrCats[c]),backgroundColor:pieColors}]},options:{animation:false,layout:{padding:40},plugins:{title:{display:true,text:'INR Expense Distribution'},legend:{position:'bottom',labels:{font:{size:9}}},datalabels:{display:true,color:'#333',anchor:'end',align:'end',offset:5,font:{size:9},formatter:pieLabelFormatter}}},plugins:[whiteBgPlugin]});inrPieData=ip.toBase64Image();ip.destroy();

    const c3=document.createElement('canvas');c3.width=600;c3.height=350;chartContainer.appendChild(c3);
    const bc=new Chart(c3,{type:'bar',data:{labels:['Total Expenses','Total Income'],datasets:[{label:'AED',data:[aedExp,aedInc],backgroundColor:'#4472C4'},{label:'INR',data:[inrExp,inrInc],backgroundColor:'#ED7D31'}]},options:{animation:false,indexAxis:'y',layout:{padding:20},plugins:{title:{display:true,text:'Income vs Expenses by Currency'},datalabels:{display:true,anchor:'end',align:'right',color:'#333',font:{weight:'bold',size:10},formatter:(v)=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}}},plugins:[whiteBgPlugin]});generatedBarData=bc.toBase64Image();bc.destroy();

    const c4=document.createElement('canvas');c4.width=600;c4.height=350;chartContainer.appendChild(c4);
    const lc=new Chart(c4,{type:'line',data:{labels:sortedDates.length?sortedDates:['No Data'],datasets:[{label:'AED Expense',data:sortedDates.length?sortedDates.map(d=>dailyExps[d].aed):[0],borderColor:'#4472C4',backgroundColor:'#4472C4'},{label:'INR Expense',data:sortedDates.length?sortedDates.map(d=>dailyExps[d].inr):[0],borderColor:'#ED7D31',backgroundColor:'#ED7D31'}]},options:{animation:false,layout:{padding:20},plugins:{title:{display:true,text:'Daily Expense Trend by Currency'},datalabels:{display:false}}},plugins:[whiteBgPlugin]});generatedLineData=lc.toBase64Image();lc.destroy();

    document.body.removeChild(chartContainer);
    }}catch(e){console.error("Dynamic chart gen failed",e);}

    try{
    if(aedPieData){const id=workbook.addImage({base64:aedPieData,extension:'png'});ws3.addImage(id,{tl:{col:0,row:aR+2},ext:{width:300,height:250}});}
    if(inrPieData){const id=workbook.addImage({base64:inrPieData,extension:'png'});ws3.addImage(id,{tl:{col:10,row:2},ext:{width:500,height:200}});}
    if(generatedBarData){const id=workbook.addImage({base64:generatedBarData,extension:'png'});ws3.addImage(id,{tl:{col:3,row:compStartR-1},ext:{width:500,height:300}});}
    if(generatedLineData){const id=workbook.addImage({base64:generatedLineData,extension:'png'});ws3.addImage(id,{tl:{col:10,row:compStartR-1},ext:{width:550,height:300}});}
    }catch(e){console.error("Could not capture charts",e);}

    // Download the workbook
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Expense_Report.xlsx');
}

const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
if(downloadSummaryBtn) {
  downloadSummaryBtn.addEventListener('click', () => {
     alert('Summary Download: Please use Export CSV for now, Summary PDF generation requires backend support.');
  });
}


/* ===== Enhanced transaction editing, Investment/EMI logs, and reports ===== */

function trackerOptions(defaultItems, storageKey) {
    return [...defaultItems, ...getStoredList(storageKey)].filter((item, index, list) =>
        list.findIndex(v => v.toLowerCase() === item.toLowerCase()) === index
    );
}

function fillSelect(selectId, items, selected = '', placeholder = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = placeholder ? `<option value="">${escapeHTML(placeholder)}</option>` : '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
    if (selected && items.includes(selected)) select.value = selected;
}

function transactionActions(id) {
    return `<div class="action-buttons">
        <button class="btn primary-btn" type="button" onclick="editTransaction(${Number(id)})">Edit</button>
        <button class="btn secondary-btn" type="button" onclick="deleteTransaction(${Number(id)})">Delete</button>
    </div>`;
}

function currencyForAccount(account) {
    return String(account || '').includes('(AED)') ? 'AED' : 'INR';
}

function shortAccount(account) {
    return String(account || '').replace(/ \(.+\)/, '');
}

function transactionRow(t, options = {}) {
    const showTo = options.showTo !== false;
    const includeNotes = options.includeNotes !== false;
    const typeText = options.typeText || t.type;
    let badge = 'active';
    if (typeText === 'Income' || typeText === 'Onhand' || typeText === 'Received') badge = 'future';
    if (typeText === 'Transfer' || typeText === 'Sent') badge = 'pending';
    const cells = [
        `<td>${escapeHTML(t.date || '')}</td>`,
        `<td><strong>${escapeHTML(shortAccount(t.account))}</strong></td>`,
        `<td>${escapeHTML(t.description || '')}</td>`,
    ];
    if (options.includeCategory !== false) cells.push(`<td>${escapeHTML(t.category || '')}</td>`);
    cells.push(`<td><span class="status-badge ${badge}">${escapeHTML(typeText || '')}</span></td>`);
    cells.push(`<td>${escapeHTML(currencyForAccount(t.account))} ${Number(t.amount || 0).toFixed(2)}</td>`);
    if (showTo) cells.push(`<td>${t.toAccount ? escapeHTML(shortAccount(t.toAccount)) : '-'}</td>`);
    if (includeNotes) cells.push(`<td>${escapeHTML(t.notes || '')}</td>`);
    cells.push(`<td>${transactionActions(t.id)}</td>`);
    return `<tr>${cells.join('')}</tr>`;
}

function renderTransactions() {
    const globalTbody = document.getElementById('transaction-list');
    if (globalTbody) globalTbody.innerHTML = '';
    
    // Clear all profile tables
    dynamicProfiles.forEach(profile => {
        const tbody = document.getElementById(`tx-list-${profile.id}`);
        if (tbody) tbody.innerHTML = '';
    });

    getFilteredTransactions().forEach(t => {
        if (globalTbody) globalTbody.innerHTML += transactionRow(t);
        
        if (t.type === 'Transfer') {
            const senderProfile = dynamicProfiles.find(p => p.accounts.includes(t.account));
            const receiverProfile = dynamicProfiles.find(p => p.accounts.includes(t.toAccount));
            
            if (senderProfile) {
                const tbody = document.getElementById(`tx-list-${senderProfile.id}`);
                if (tbody) tbody.innerHTML += transactionRow(t, { typeText: 'Sent', showTo: true, includeNotes: false });
            }
            
            if (receiverProfile) {
                const receiver = { ...t, account: t.toAccount || t.account, toAccount: '' };
                const tbody = document.getElementById(`tx-list-${receiverProfile.id}`);
                if (tbody) tbody.innerHTML += transactionRow(receiver, { typeText: 'Received', showTo: true, includeNotes: false });
            }
        } else {
            const profile = dynamicProfiles.find(p => p.accounts.includes(t.account));
            if (profile) {
                const tbody = document.getElementById(`tx-list-${profile.id}`);
                if (tbody) tbody.innerHTML += transactionRow(t, { showTo: true, includeNotes: false });
            }
        }
    });
}

function renderSpecialTransactionLogs() {
    const investmentBody = document.getElementById('investment-transaction-list');
    const emiBody = document.getElementById('emi-transaction-list');
    if (investmentBody) investmentBody.innerHTML = '';
    if (emiBody) emiBody.innerHTML = '';
    transactions.forEach(t => {
        const normalizedCategory = String(t.category || '').trim().toLowerCase();
        const miniRow = `<tr>
            <td>${escapeHTML(t.date || '')}</td><td><strong>${escapeHTML(shortAccount(t.account))}</strong></td>
            <td>${escapeHTML(t.description || '')}</td><td><span class="status-badge ${t.type === 'Expense' ? 'active' : 'future'}">${escapeHTML(t.type || '')}</span></td>
            <td>${escapeHTML(currencyForAccount(t.account))} ${Number(t.amount || 0).toFixed(2)}</td>
            <td>${escapeHTML(t.notes || '')}</td><td>${transactionActions(t.id)}</td>
        </tr>`;
        if (normalizedCategory === 'investment' && investmentBody) investmentBody.innerHTML += miniRow;
        if (normalizedCategory === 'emi' && emiBody) emiBody.innerHTML += miniRow;
    });
    if (investmentBody && !investmentBody.innerHTML) investmentBody.innerHTML = '<tr><td colspan="7" class="empty-table-message">No Investment transactions found.</td></tr>';
    if (emiBody && !emiBody.innerHTML) emiBody.innerHTML = '<tr><td colspan="7" class="empty-table-message">No EMI transactions found.</td></tr>';
}

function toggleEditToAccount() {
    const group = document.getElementById('edit-to-account-group');
    const type = document.getElementById('edit-type');
    if (group && type) group.style.display = type.value === 'Transfer' ? 'block' : 'none';
}

window.editTransaction = function(id) {
    const t = transactions.find(item => Number(item.id) === Number(id));
    if (!t) { alert('Transaction not found. Refresh the page and try again.'); return; }
    fillSelect('edit-type', trackerOptions(DEFAULT_TYPES, 'expenseTrackerCustomTypes'), t.type);
    fillSelect('edit-category', trackerOptions(DEFAULT_CATEGORIES, 'expenseTrackerCustomCategories'), t.category);
    fillSelect('edit-account', trackerOptions(DEFAULT_ACCOUNTS, 'expenseTrackerCustomAccounts'), t.account);
    fillSelect('edit-to-account', trackerOptions(DEFAULT_ACCOUNTS, 'expenseTrackerCustomAccounts'), t.toAccount || '');
    document.getElementById('edit-id').value = t.id;
    document.getElementById('edit-date').value = t.date || '';
    document.getElementById('edit-description').value = t.description || '';
    document.getElementById('edit-amount').value = Number(t.amount || 0);
    document.getElementById('edit-notes').value = t.notes || '';
    toggleEditToAccount();
    document.getElementById('edit-transaction-modal').style.display = 'flex';
};

function closeEditTransactionModal() {
    const modal = document.getElementById('edit-transaction-modal');
    if (modal) modal.style.display = 'none';
}

window.deleteTransaction = function(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    fetch('api.php?action=delete_transaction', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
    }).then(res => res.json()).then(data => {
        if (data.status === 'success') {
            transactions = transactions.filter(t => Number(t.id) !== Number(id));
            renderAll();
        } else alert(data.message || 'Error deleting transaction.');
    }).catch(() => alert('Network error while deleting the transaction.'));
};

function populateReportFilters() {
    const selectedMonth = document.getElementById('report-month-filter')?.value || '';
    const selectedBank = document.getElementById('report-bank-filter')?.value || '';
    const selectedCategory = document.getElementById('report-category-filter')?.value || '';
    const selectedType = document.getElementById('report-type-filter')?.value || '';
    const months = [...new Set(transactions.map(t => String(t.date || '').slice(0, 7)).filter(Boolean))].sort().reverse();
    const transactionCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    const transactionTypes = [...new Set(transactions.map(t => t.type).filter(Boolean))];
    fillSelect('report-month-filter', months, selectedMonth, 'All Months');
    fillSelect('report-bank-filter', trackerOptions(DEFAULT_ACCOUNTS, 'expenseTrackerCustomAccounts'), selectedBank, 'All Banks');
    fillSelect('report-category-filter', [...new Set([...trackerOptions(DEFAULT_CATEGORIES, 'expenseTrackerCustomCategories'), ...transactionCategories])], selectedCategory, 'All Categories');
    fillSelect('report-type-filter', [...new Set([...trackerOptions(DEFAULT_TYPES, 'expenseTrackerCustomTypes'), ...transactionTypes])], selectedType, 'All Types');
}

function getReportTransactions() {
    const month = document.getElementById('report-month-filter')?.value || '';
    const bank = document.getElementById('report-bank-filter')?.value || '';
    const category = document.getElementById('report-category-filter')?.value || '';
    const type = document.getElementById('report-type-filter')?.value || '';
    return transactions.filter(t => {
        const monthMatch = !month || String(t.date || '').slice(0, 7) === month;
        const bankMatch = !bank || t.account === bank || (t.type === 'Transfer' && t.toAccount === bank);
        return monthMatch && bankMatch && (!category || t.category === category) && (!type || t.type === type);
    });
}

function renderReports() {
    const tbody = document.getElementById('report-transaction-list');
    if (!tbody) return;
    const data = getReportTransactions();
    tbody.innerHTML = '';
    const bank = document.getElementById('report-bank-filter')?.value || '';
    let income = 0, expense = 0, balance = 0, paidAmount = 0;
    const categoryTotals = {};
    data.forEach(t => {
        const amount = Number(t.amount || 0);
        if (t.type === 'Income' || t.type === 'Onhand') { income += amount; balance += amount; }
        if (t.type === 'Expense') { expense += amount; balance -= amount; categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount; }
        if (t.type === 'Transfer') { 
            if (bank && t.toAccount === bank) {
                balance += amount;
                paidAmount += amount;
            } else {
                balance -= amount;
            }
        }
        tbody.innerHTML += transactionRow(t, { includeNotes: false, showTo: true });
    });
    if (!tbody.innerHTML) tbody.innerHTML = '<tr><td colspan="8" class="empty-table-message">No transactions match the selected report filters.</td></tr>';
    const currency = bank ? currencyForAccount(bank) : 'Mixed';
    const prefix = currency === 'Mixed' ? '' : `${currency} `;
    const incomeCard = document.getElementById('report-income-card');
    const expenseCard = document.getElementById('report-expense-card');
    const debtCard = document.getElementById('report-debt-card');
    const paidCard = document.getElementById('report-paid-card');
    const availCard = document.getElementById('report-available-card');
    const netCard = document.getElementById('report-net-card');

    if (bank && bank.includes('CC')) {
        const creditLimit = 15400; // Total credit Limit
        const needToPay = Math.max(0, expense - income - paidAmount); // Calculate used amount (need to pay)
        const availableBalance = creditLimit - needToPay;

        if (incomeCard) incomeCard.style.display = 'none';
        
        if (expenseCard) {
            expenseCard.style.display = 'flex';
            document.getElementById('report-expense-title').innerText = 'Total Expenses';
            document.getElementById('report-expense').innerText = prefix + expense.toFixed(2);
        }
        
        if (debtCard) {
            debtCard.style.display = 'flex';
            document.getElementById('report-debt-title').innerText = 'Need to pay';
            document.getElementById('report-debt').innerText = prefix + needToPay.toFixed(2);
        }
        
        if (paidCard) {
            paidCard.style.display = 'flex';
            document.getElementById('report-paid-title').innerText = 'Total Paid amount';
            document.getElementById('report-paid').innerText = prefix + paidAmount.toFixed(2);
        }
        
        if (availCard) {
            availCard.style.display = 'flex';
            document.getElementById('report-available-title').innerText = 'Total available Bal';
            document.getElementById('report-available').innerText = prefix + availableBalance.toFixed(2);
        }
        
        if (netCard) {
            netCard.style.display = 'flex';
            document.getElementById('report-net-title').innerText = 'Total credit Limit';
            document.getElementById('report-net').innerText = prefix + creditLimit.toFixed(2);
        }
    } else {
        if (incomeCard) {
            incomeCard.style.display = 'flex';
            document.getElementById('report-income-title').innerText = 'Total Income / Onhand';
            document.getElementById('report-income').innerText = prefix + income.toFixed(2);
        }
        if (expenseCard) {
            expenseCard.style.display = 'flex';
            document.getElementById('report-expense-title').innerText = 'Total Expenses';
            document.getElementById('report-expense').innerText = prefix + expense.toFixed(2);
        }
        if (netCard) {
            netCard.style.display = 'flex';
            document.getElementById('report-net-title').innerText = bank ? 'Selected Bank Balance Change' : 'Net Change (Mixed Currencies)';
            document.getElementById('report-net').innerText = prefix + balance.toFixed(2);
        }
        if (debtCard) debtCard.style.display = 'none';
        if (paidCard) paidCard.style.display = 'none';
        if (availCard) availCard.style.display = 'none';
    }
    if (typeof Chart === 'undefined') return;
    const pieCtx = document.getElementById('categoryPieChart');
    const barCtx = document.getElementById('incomeExpenseBarChart');
    if (!pieCtx || !barCtx) return;
    if (pieChartInstance) pieChartInstance.destroy();
    if (barChartInstance) barChartInstance.destroy();
    const labels = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    pieChartInstance = new Chart(pieCtx, { type:'doughnut', data:{ labels: labels.length ? labels : ['No Expense Data'], datasets:[{ data: amounts.length ? amounts : [1] }] }, options:{responsive:true, maintainAspectRatio:false} });
    barChartInstance = new Chart(barCtx, { type:'bar', data:{ labels:['Income / Onhand','Expenses'], datasets:[{label:'Amount', data:[income, expense]}] }, options:{responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}}, plugins:{legend:{display:false}}} });
}

window.goToAccountReport = function(accountName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="tab-reports"]')?.classList.add('active');
    document.getElementById('tab-reports')?.classList.add('active');
    const bank = document.getElementById('report-bank-filter');
    if (bank) { bank.value = accountName; renderReports(); }
};

function renderAll() {
    renderProfiles();
    populateMonthFilter();
    renderInvestments();
    renderDynamicEmis();
    renderTransactions();
    renderSpecialTransactionLogs();
    updateDashboardTotals();
    populateReportFilters();
    renderReports();
}
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        const tabId = e.target.getAttribute('data-tab');
        if (tabId) {
            const contentTab = document.getElementById(tabId);
            if (contentTab) contentTab.classList.add('active');
        }
        updateDynamicProfileActions();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('edit-type')?.addEventListener('change', toggleEditToAccount);
    document.getElementById('close-edit-investment')?.addEventListener('click', closeEditInvestmentModal);
    document.getElementById('cancel-edit-investment')?.addEventListener('click', closeEditInvestmentModal);
    document.getElementById('edit-investment-modal')?.addEventListener('click', e => { if (e.target.id === 'edit-investment-modal') closeEditInvestmentModal(); });

    document.getElementById('close-add-investment')?.addEventListener('click', closeAddInvestmentModal);
    document.getElementById('cancel-add-investment')?.addEventListener('click', closeAddInvestmentModal);
    document.getElementById('add-investment-modal')?.addEventListener('click', e => { if (e.target.id === 'add-investment-modal') closeAddInvestmentModal(); });

    document.getElementById('add-investment-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const before = JSON.parse(JSON.stringify(investments));
        const fields = ['sn', 'inv', 'plan', 'status', 'amount', 'start', 'dop', 'platform', 'num', 'app', 'policy', 'bank'];
        const newInv = {};
        fields.forEach(field => newInv[field] = document.getElementById(`add-investment-${field}`).value.trim());
        newInv.sn = Number(newInv.sn) || investments.length + 1;
        
        if (!newInv.inv || !newInv.plan || !newInv.status || !newInv.amount) { 
            alert('Investment, plan, status, and amount are required.'); 
            return; 
        }
        
        investments.push(newInv);
        saveInvestmentsToDatabase().then(() => {
            closeAddInvestmentModal();
            renderAll();
            alert('Investment added successfully.');
        }).catch(error => {
            investments = before;
            renderAll();
            alert(error.message || 'Could not add the investment.');
        });
    });
    document.getElementById('close-investment-payment-history')?.addEventListener('click', closeInvestmentPaymentHistory);
    document.getElementById('investment-payment-history-modal')?.addEventListener('click', e => { if (e.target.id === 'investment-payment-history-modal') closeInvestmentPaymentHistory(); });
    document.getElementById('edit-investment-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const index = Number(document.getElementById('edit-investment-index').value);
        if (!Number.isInteger(index) || !investments[index]) return;
        const before = JSON.parse(JSON.stringify(investments));
        const fields = ['sn', 'inv', 'plan', 'status', 'amount', 'start', 'dop', 'platform', 'num', 'app', 'policy', 'bank'];
        const updated = {};
        fields.forEach(field => updated[field] = document.getElementById(`edit-investment-${field}`).value.trim());
        updated.sn = Number(updated.sn) || index + 1;
        if (!updated.inv || !updated.plan || !updated.status || !updated.amount) { alert('Investment, plan, status, and amount are required.'); return; }
        investments[index] = { ...investments[index], ...updated };
        saveInvestmentsToDatabase().then(() => {
            closeEditInvestmentModal();
            renderAll();
            alert('Investment record updated successfully.');
        }).catch(error => {
            investments = before;
            renderAll();
            alert(error.message || 'Could not update the investment record.');
        });
    });
    document.getElementById('close-edit-transaction')?.addEventListener('click', closeEditTransactionModal);
    document.getElementById('cancel-edit-transaction')?.addEventListener('click', closeEditTransactionModal);
    document.getElementById('edit-transaction-modal')?.addEventListener('click', e => { if (e.target.id === 'edit-transaction-modal') closeEditTransactionModal(); });
    document.getElementById('edit-transaction-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const update = {
            id: document.getElementById('edit-id').value,
            date: document.getElementById('edit-date').value,
            type: document.getElementById('edit-type').value,
            category: document.getElementById('edit-category').value,
            account: document.getElementById('edit-account').value,
            toAccount: document.getElementById('edit-type').value === 'Transfer' ? document.getElementById('edit-to-account').value : '',
            description: document.getElementById('edit-description').value.trim(),
            amount: parseFloat(document.getElementById('edit-amount').value),
            notes: document.getElementById('edit-notes').value.trim()
        };
        if (!update.description || !Number.isFinite(update.amount)) { alert('Enter a description and valid amount.'); return; }
        if (update.type === 'Transfer' && !update.toAccount) { alert('Select a destination account for the transfer.'); return; }
        fetch('api.php?action=update_transaction', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(update) })
        .then(res => res.json()).then(data => {
            if (data.status !== 'success') throw new Error(data.message || 'Update failed');
            transactions = transactions.map(t => Number(t.id) === Number(update.id) ? { ...t, ...update } : t);
            closeEditTransactionModal(); renderAll();
        }).catch(err => alert(err.message || 'Could not update the transaction.'));
    });
    ['report-month-filter','report-bank-filter','report-category-filter','report-type-filter'].forEach(id => document.getElementById(id)?.addEventListener('change', renderReports));
    document.getElementById('clear-report-filters')?.addEventListener('click', () => {
        ['report-month-filter','report-bank-filter','report-category-filter','report-type-filter'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
        renderReports();
    });
    document.getElementById('settings-toggle')?.addEventListener('click', renderBudgetSettings);
    document.getElementById('save-settings')?.addEventListener('click', saveBudgetSettings);
});

// --- Settings Modal: Dynamic Budgets ---
function renderBudgetSettings() {
    const list = document.getElementById('settings-budget-list');
    if (!list) return;
    
    // Get all unique categories
    const transactionCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    const allCategories = [...new Set([...trackerOptions(DEFAULT_CATEGORIES, 'expenseTrackerCustomCategories'), ...transactionCategories])];
    
    // Load saved budgets
    let savedBudgets = {};
    try {
        savedBudgets = JSON.parse(localStorage.getItem('expenseTrackerCategoryBudgets')) || {};
    } catch(e) {}
    
    list.innerHTML = '';
    
    // Fallback icon generation
    const getIcon = (catName) => {
        const lower = catName.toLowerCase();
        if(lower.includes('food') || lower.includes('dining') || lower.includes('grocery')) return '🍴';
        if(lower.includes('transport') || lower.includes('petrol')) return '🚗';
        if(lower.includes('shop')) return '🛍️';
        if(lower.includes('entertainment') || lower.includes('movie')) return '🎞️';
        if(lower.includes('bill') || lower.includes('util') || lower.includes('emi')) return '🧾';
        if(lower.includes('health') || lower.includes('medical')) return '🏥';
        if(lower.includes('education') || lower.includes('school')) return '📘';
        if(lower.includes('invest')) return '📈';
        return '⋯';
    };

    const currentSym = typeof currentSymbol !== 'undefined' ? currentSymbol : 'AED';

    allCategories.forEach(cat => {
        if (cat === 'Opening Balance' || cat === 'Transfer') return;
        
        const val = savedBudgets[cat] || 0;
        const icon = getIcon(cat);
        
        list.innerHTML += `
            <div class="budget-item">
                <span class="category-icon" style="background: rgba(100, 100, 100, 0.1); color: #555;">${icon}</span>
                <span class="category-name">${escapeHTML(cat)}</span>
                <div class="input-with-symbol">
                    <span class="currency-symbol">${currentSym}</span>
                    <input type="number" class="budget-input" data-category="${encodeURIComponent(cat)}" value="${val}" min="0" step="any">
                </div>
            </div>
        `;
    });
}

function saveBudgetSettings() {
    const inputs = document.querySelectorAll('.budget-input');
    let savedBudgets = {};
    inputs.forEach(input => {
        const cat = decodeURIComponent(input.getAttribute('data-category'));
        const val = Number(input.value) || 0;
        savedBudgets[cat] = val;
    });
}

// --- Automatic Logout After Inactivity (5 minutes) ---
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    // 5 minutes = 300000 milliseconds
    inactivityTimer = setTimeout(() => {
        alert("You have been automatically logged out due to inactivity.");
        window.location.href = 'logout.php';
    }, 300000);
}

// Listen for various user interactions to reset the timer
window.onload = resetInactivityTimer;
document.onmousemove = resetInactivityTimer;
document.onkeypress = resetInactivityTimer;
document.onmousedown = resetInactivityTimer;
document.ontouchstart = resetInactivityTimer;
document.onclick = resetInactivityTimer;
document.onscroll = resetInactivityTimer;
