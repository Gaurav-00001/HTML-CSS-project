let currentUser = null;
let currentView = 'daily';
let myChart = null;
let isSignUp = false;

// --- AUTHENTICATION ---
function toggleAuth() {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').innerText = isSignUp ? "Create Account" : "Welcome Back";
    document.getElementById('auth-btn').innerText = isSignUp ? "Register" : "Sign In";
    document.getElementById('toggle-text').innerText = isSignUp ? "Already have an account?" : "Don't have an account?";
    document.querySelector('.toggle-link').innerText = isSignUp ? "Login here" : "Create one";
}

function handleAuth() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    const pass = document.getElementById('password').value;
    emailInput.style.border = "1px solid #ddd";

    if(!email || !pass) return alert("Please fill all fields");

    let storedData = JSON.parse(localStorage.getItem(email));

    if(isSignUp) {
        if(storedData) return alert("This Email is already registered.");
        localStorage.setItem(email, JSON.stringify({ password: pass, expenses: [] }));
        alert("Account Created!");
        toggleAuth(); 
    } else {
        if (!storedData) {
            emailInput.style.border = "2px solid #ef4444";
            alert("Error: Email ID not registered.");
            return; 
        }
        if(storedData.password === pass) {
            currentUser = email;
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('p-date').valueAsDate = new Date();
            updateUI();
        } else {
            alert("Invalid Password.");
        }
    }
}

// --- DASHBOARD LOGIC ---
function addExpense() {
    const name = document.getElementById('p-name').value;
    const cat = document.getElementById('p-cat').value;
    const amt = parseFloat(document.getElementById('p-amount').value);
    const date = document.getElementById('p-date').value;

    if(!name || isNaN(amt) || !date) return alert("Please fill all fields correctly");

    const data = JSON.parse(localStorage.getItem(currentUser));
    // IMPORTANT: Check that id is being created here
    data.expenses.push({ name, cat, amt, date, id: Date.now() });
    localStorage.setItem(currentUser, JSON.stringify(data));
    
    document.getElementById('p-name').value = "";
    document.getElementById('p-amount').value = "";
    updateUI();
}

// THIS IS THE ONLY DELETE FUNCTION YOU NEED
function deleteExpense(id) {
    if(confirm("Are you sure you want to delete this expense?")) {
        const data = JSON.parse(localStorage.getItem(currentUser));
        
        // Filter out the item
        data.expenses = data.expenses.filter(exp => exp.id !== id);
        
        localStorage.setItem(currentUser, JSON.stringify(data));
        updateUI();
    }
}

function changeView(view, btn) {
    currentView = view;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateUI();
}

function updateUI() {
    const data = JSON.parse(localStorage.getItem(currentUser));
    const now = new Date();
    
    const filtered = data.expenses.filter(exp => {
        const d = new Date(exp.date);
        if(currentView === 'daily') return d.toDateString() === now.toDateString();
        if(currentView === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if(currentView === 'yearly') return d.getFullYear() === now.getFullYear();
    });

    const catTotals = {};
    let total = 0;
    const list = document.getElementById('expense-list');
    if (list) list.innerHTML = ""; 

    filtered.forEach(exp => {
        catTotals[exp.cat] = (catTotals[exp.cat] || 0) + exp.amt;
        total += exp.amt;

        const li = document.createElement('li');
        li.className = "expense-item"; 
        li.innerHTML = `
            <div style="text-align: left;">
                <strong>${exp.name}</strong><br>
                <small style="color: #64748b;">${exp.cat} | ${exp.date}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold;">$${exp.amt.toFixed(2)}</span>
                <button onclick="deleteExpense(${exp.id})" class="del-btn">Delete</button>
            </div>
        `;
        if (list) list.appendChild(li);
    });

    document.getElementById('period-total').innerText = `$${total.toFixed(2)}`;
    document.getElementById('item-count').innerText = filtered.length;
    const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
    document.getElementById('top-cat').innerText = sortedCats[0] ? sortedCats[0][0] : '-';

    updateChart(catTotals);
}

function updateChart(catTotals) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    if(myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catTotals),
            datasets: [{
                data: Object.values(catTotals),
                backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
                borderWidth: 2
            }]
        },
        options: { maintainAspectRatio: false }
    });
}