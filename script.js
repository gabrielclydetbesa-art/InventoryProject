// ------------------- USER DASHBOARD -------------------
function loadUserDashboard() {
    const currentUser = localStorage.getItem('currentUser');
    const isAdmin = localStorage.getItem('currentUserIsAdmin') === 'true';
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userPerms = users[currentUser];

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById('currentUserEmail').innerText = currentUser;

    // Load products table
    const productTable = document.getElementById('productTable');
    if (productTable) {
        loadProducts();
    }

    // Disable Add Product button if user cannot add
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) addBtn.disabled = isAdmin ? false : !userPerms.canAddProduct;

    // Disable View Activity button if user cannot view
    const activityBtn = document.querySelector('button[onclick="toggleActivity()"]');
    if (activityBtn) activityBtn.disabled = isAdmin ? false : !userPerms.canViewActivity;

    // Hide activity container initially
    const activityContainer = document.getElementById('adminActivityContainer');
    if (activityContainer) activityContainer.style.display = 'none';
}

// Load user products
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.querySelector('#productTable tbody');
    const currentUser = localStorage.getItem('currentUser') || "Unknown";
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const perms = users[currentUser];

    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><input type="text" value="${product.name}" id="name-${product.id}" style="width:120px;" ${!perms.canEditProduct ? 'disabled' : ''}></td>
            <td><input type="number" min="0" value="${product.quantity}" id="qty-${product.id}" style="width:60px;" ${!perms.canEditProduct ? 'disabled' : ''}></td>
            <td><button onclick="confirmProductChange(${product.id}, '${currentUser}')" ${!perms.canEditProduct ? 'disabled' : ''}>Confirm</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ------------------- LOGIN / SIGN IN / RESET -------------------
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!email || !password) {
        document.getElementById('loginMessage').innerText = "Please enter email and password";
        return;
    }

    if (!users[email]) {
        alert("Email not found. Redirecting to Sign In.");
        window.location.href = "sign-in.html";
        return;
    }

    if (typeof users[email] === 'string') {
        users[email] = { password: users[email], isAdmin: false };
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (users[email].password !== password) {
        const change = confirm("Password incorrect. Do you want to reset your password?");
        if (change) window.location.href = "reset-password.html";
        return;
    }

    localStorage.setItem('currentUser', email);
    localStorage.setItem('currentUserIsAdmin', users[email].isAdmin);

    if (users[email].isAdmin) window.location.href = "admin-dashboard.html";
    else window.location.href = "dashboard.html";
}

function signIn() {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    const confirmPassword = document.getElementById('signInConfirmPassword').value;
    const isAdmin = document.getElementById('isAdmin').checked;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!email || !password || !confirmPassword) {
        document.getElementById('signInMessage').innerText = "Please fill in all fields";
        return;
    }

    if (password !== confirmPassword) {
        document.getElementById('signInMessage').innerText = "Passwords do not match";
        return;
    }

    // Initialize permissions: admins always have full permissions
    users[email] = {
        password: password,
        isAdmin: isAdmin,
        canAddProduct: !isAdmin ? true : true,
        canEditProduct: !isAdmin ? true : true,
        canViewActivity: !isAdmin ? true : true
    };

    localStorage.setItem('users', JSON.stringify(users));
    alert("Account created! Redirecting to login page.");
    window.location.href = "index.html";
}

function verifyEmail() {
    const email = document.getElementById('resetEmail').value;
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!email) {
        document.getElementById('resetMessage').innerText = "Enter your email";
        return;
    }

    if (!users[email]) {
        document.getElementById('resetMessage').innerText = "Email not found";
        return;
    }

    document.getElementById('newPasswordSection').style.display = "block";
    document.getElementById('resetMessage').innerText = "";
}

function resetPassword() {
    const email = document.getElementById('resetEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!newPassword || !confirmNewPassword) {
        document.getElementById('resetMessage').innerText = "Enter all fields";
        return;
    }

    if (newPassword !== confirmNewPassword) {
        document.getElementById('resetMessage').innerText = "Passwords do not match";
        return;
    }

    users[email].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    alert("Password changed! Redirecting to login page.");
    window.location.href = "index.html";
}

// ------------------- LOGOUT -------------------
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserIsAdmin');
    window.location.href = "index.html";
}

// ------------------- PRODUCTS -------------------
function confirmProductChange(productId, user) {
    let products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const nameInput = document.getElementById(`name-${productId}`) || document.getElementById(`adminName-${productId}`);
    const qtyInput = document.getElementById(`qty-${productId}`) || document.getElementById(`adminQty-${productId}`);

    const newName = nameInput.value.trim();
    let newQty = parseInt(qtyInput.value);

    if (!newName) { alert("Product name cannot be empty!"); loadProducts(); loadAdminProductsTable(); return; }
    if (isNaN(newQty) || newQty < 0) { alert("Quantity must be 0 or higher!"); loadProducts(); loadAdminProductsTable(); return; }

    const activities = JSON.parse(localStorage.getItem('activities') || '[]');

    if (newName !== product.name) {
        activities.push({ user, action: `Changed name of product ID ${product.id} from "${product.name}" to "${newName}"`, timestamp: new Date().toLocaleString() });
        product.name = newName;
    }

    if (newQty !== product.quantity) {
    activities.push({
        user,
        action: `Changed quantity of product ID ${product.id} from ${product.quantity} to ${newQty}`,
        timestamp: new Date().toISOString()
    });
    product.quantity = newQty;
}
   
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('activities', JSON.stringify(activities));
    alert(`Product ID ${product.id} updated successfully!`);

    refreshTables();
}

function addProduct() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const currentUser = localStorage.getItem('currentUser') || "Unknown";

    let name = prompt("Enter product name:");
    if (!name) return alert("Product name cannot be empty!");

    let quantity = prompt("Enter quantity (minimum 1):", "1");
    quantity = parseInt(quantity); if (isNaN(quantity) || quantity < 1) quantity = 1;

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, name, quantity };
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));

    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.push({ user: currentUser, action: `Added product: ${name} (Qty: ${quantity})`, timestamp: new Date().toLocaleString() });
    localStorage.setItem('activities', JSON.stringify(activities));

	refreshTables();
}

// ------------------- ADMIN -------------------
let productsVisible = false;
function toggleProducts() {
    const container = document.getElementById('adminProductsContainer');
    productsVisible = !productsVisible;
    container.style.display = productsVisible ? 'block' : 'none';
    if (productsVisible) loadAdminProductsTable();
}

function loadAdminProductsTable() {
    const tbody = document.querySelector('#adminProductTable tbody');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const currentUser = localStorage.getItem('currentUser') || "Unknown";

    tbody.innerHTML = ''; // Clear table
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><input type="text" value="${product.name}" id="adminName-${product.id}" style="width:120px;"></td>
            <td><input type="number" min="0" value="${product.quantity}" id="adminQty-${product.id}" style="width:60px;"></td>
            <td>
                <button onclick="confirmProductChange(${product.id}, '${currentUser}')">Confirm</button>
                <button onclick="deleteProduct(${product.id}, '${currentUser}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}	

function searchProducts() {
    const input = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productTable tbody tr');
    rows.forEach(row => {
        const id = row.cells[0].innerText.toLowerCase();
        const name = row.cells[1].querySelector('input').value.toLowerCase();
        row.style.display = id.includes(input) || name.includes(input) ? '' : 'none';
    });
}

function searchAdminProducts() {
    const input = document.getElementById('adminProductSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#adminProductTable tbody tr');
    rows.forEach(row => {
        const id = row.cells[0].innerText.toLowerCase();
        const name = row.cells[1].querySelector('input').value.toLowerCase();
        row.style.display = id.includes(input) || name.includes(input) ? '' : 'none';
    });
}

// ------------------- ACTIVITY -------------------
let activityVisible = false;
function toggleActivity() {
    const container = document.getElementById('adminActivityContainer');
    activityVisible = !activityVisible;
    container.style.display = activityVisible ? 'block' : 'none';
    if (activityVisible) loadActivityTable();
}

function loadActivityTable() {
    const tbody = document.querySelector('#activityTable tbody');
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    tbody.innerHTML = '';
    activities.forEach(act => {
        const row = document.createElement('tr');
        const formattedTime = new Date(act.timestamp).toLocaleString();

row.innerHTML = `
    <td>${act.user}</td>
    <td>${act.action}</td>
    <td>${formattedTime}</td>
`;
        tbody.appendChild(row);
    });
}

// ------------------- USERS -------------------
function toggleUsers() {
    const container = document.getElementById('adminUsersContainer');
    const visible = container.style.display === 'block';
    container.style.display = visible ? 'none' : 'block';
    if (!visible) loadUsersTable();
}

function loadUsersTable() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUser = localStorage.getItem('currentUser') || "Unknown";

    // Ensure all users have permission fields
    Object.keys(users).forEach(email => {
        const user = users[email];
        if (user.canAddProduct === undefined) user.canAddProduct = true;
        if (user.canEditProduct === undefined) user.canEditProduct = true;
        if (user.canViewActivity === undefined) user.canViewActivity = true;
    });
    localStorage.setItem('users', JSON.stringify(users));

    Object.keys(users).forEach(email => {
        const user = users[email];
        const isAdminDisabled = user.isAdmin ? 'disabled' : '';
        const deleteButton = user.isAdmin ? '' : `<button onclick="deleteUser('${email}', '${currentUser}')">Delete</button>`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${email}</td>
            <td><input type="checkbox" ${user.isAdmin ? 'checked disabled' : ''}></td>
            <td><input type="checkbox" id="add-${email}" ${user.canAddProduct ? 'checked' : ''} ${isAdminDisabled}></td>
            <td><input type="checkbox" id="edit-${email}" ${user.canEditProduct ? 'checked' : ''} ${isAdminDisabled}></td>
            <td><input type="checkbox" id="view-${email}" ${user.canViewActivity ? 'checked' : ''} ${isAdminDisabled}></td>
            <td>
                <button onclick="confirmUserChange('${email}', '${currentUser}')">Confirm</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function confirmUserChange(email, adminUser) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];
    if (!user || user.isAdmin) return; // Protect admin

    if (user.canAddProduct === undefined) user.canAddProduct = false;
    if (user.canEditProduct === undefined) user.canEditProduct = false;
    if (user.canViewActivity === undefined) user.canViewActivity = false;

    user.canAddProduct = document.getElementById(`add-${email}`).checked;
    user.canEditProduct = document.getElementById(`edit-${email}`).checked;
    user.canViewActivity = document.getElementById(`view-${email}`).checked;

    users[email] = user;
    localStorage.setItem('users', JSON.stringify(users));

    let activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.push({
        user: adminUser,
        action: `Updated permissions for ${email}: Add(${user.canAddProduct}), Edit(${user.canEditProduct}), ViewActivity(${user.canViewActivity})`,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('activities', JSON.stringify(activities));

    alert(`Permissions updated for ${email}`);
}

function deleteUser(email, adminUser) {
    if (!confirm(`Are you sure you want to delete the account: ${email}?`)) return;

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[email] || users[email].isAdmin) {
        alert("Cannot delete this account.");
        return;
    }

    delete users[email];
    localStorage.setItem('users', JSON.stringify(users));

    let activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.push({
        user: adminUser,
        action: `Deleted user account: ${email}`,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('activities', JSON.stringify(activities));

    alert(`User ${email} deleted successfully.`);
    refreshTables();
}

function deleteProduct(productId, user) {
    let products = JSON.parse(localStorage.getItem('products') || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    // Remove the product
    products.splice(productIndex, 1);
    localStorage.setItem('products', JSON.stringify(products));

    // Log the deletion in the activity table
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.push({
        user: user,
        action: `Deleted product: "${product.name}" (ID: ${product.id})`,
        timestamp: new Date().toLocaleString() // normal timestamp for display
    });
    localStorage.setItem('activities', JSON.stringify(activities));

    // Refresh tables
    loadAdminProductsTable();
    if (document.getElementById('adminActivityContainer')?.style.display === 'block') {
        loadActivityTable(); // update activity log immediately
    }
}

let productChangesVisible = false;

function toggleProductChanges() {
    const container = document.getElementById('productChangesContainer');
    productChangesVisible = !productChangesVisible;
    container.style.display = productChangesVisible ? 'block' : 'none';
    
    if (productChangesVisible) loadProductChanges();
}

function loadProductChanges() {
    const tbody = document.querySelector('#productChangesTable tbody');
    tbody.innerHTML = '';

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');

    const timeFilter = document.getElementById('timeFilter').value;
    let cutoff = new Date();

    switch(timeFilter) {
        case '1h': cutoff.setHours(cutoff.getHours() - 1); break;
        case '1d': cutoff.setDate(cutoff.getDate() - 1); break;
        case '1m': cutoff.setMonth(cutoff.getMonth() - 1); break;
        case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
        default: break;
    }

    // Prepare changes: { productId: totalChange }
    const changes = {};

    // Initialize all products to 0 change
    products.forEach(p => { changes[p.id] = 0; });

    activities.forEach(act => {
        const ts = new Date(act.timestamp);
        if (ts < cutoff) return;

        const qtyMatch = act.action.match(/Changed quantity of .* from (\d+) to (\d+)/);
        if (qtyMatch) {
            const oldQty = parseInt(qtyMatch[1]);
            const newQty = parseInt(qtyMatch[2]);
            const diff = newQty - oldQty;

            const idMatch = act.action.match(/product ID (\d+)/);
            let productId = idMatch ? parseInt(idMatch[1]) : null;

            if (productId !== null) {
                changes[productId] += diff;
            }
        }
    });

    // Display table
    products.forEach(p => {
        const row = document.createElement('tr');
        const change = changes[p.id];
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${change > 0 ? '+' : ''}${change}</td>
        `;
        tbody.appendChild(row);
    });
}

function resetSystem(adminUser) {
    if (!confirm("WARNING: This will delete ALL data (products, users, activity logs).\nOnly admin accounts will remain.\n\nContinue?")) return;

    // Get all users
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    // Keep ONLY admin accounts
    let newUsers = {};
    Object.keys(users).forEach(email => {
        if (users[email].isAdmin) {
            newUsers[email] = users[email];
        }
    });

    // Save cleaned users
    localStorage.setItem('users', JSON.stringify(newUsers));

    // Clear products and activities
    localStorage.setItem('products', JSON.stringify([]));
    localStorage.setItem('activities', JSON.stringify([]));

    // Log the reset (optional but useful)
    let activities = [{
        user: adminUser,
        action: "System reset: All data cleared except admin accounts",
        timestamp: new Date().toISOString()
    }];
    localStorage.setItem('activities', JSON.stringify(activities));

    alert("System reset successful!");

    // Refresh admin tables
    if (typeof loadAdminProductsTable === "function") loadAdminProductsTable();
    if (typeof loadUsersTable === "function") loadUsersTable();
    if (typeof loadActivityTable === "function") loadActivityTable();
}

function refreshTables() {
    if (document.getElementById('productTable')) {
        loadProducts();
    }

    if (document.getElementById('adminProductTable')) {
        loadAdminProductsTable();
    }

    // Also refresh product changes if visible
    if (document.getElementById('productChangesContainer')?.style.display === 'block') {
        loadProductChanges();
    }
}