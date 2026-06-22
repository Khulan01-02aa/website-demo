
let categories = []
let products = []

let currentUser = {
    name:"",
    email:"",
    phone:"",
    address:""
}
let recentlyViewed =[]
let filteredProducts = []
let cart = []
let orders = []
let currentOrderSteps = 1;

async function loadData(){
    try{
        const response = await fetch("data.json")
        if(!response.ok){
            throw new Error("Failed to load data")
        }
        const data = await response.json()
        categories = data.categories
        products = data.products

        initializeApp()
    } catch(error) {
        console.error("Error loading data:",error)

        document.body.innerHTML = '<div style="text-align:center; margin-top: 50px;"><h2>Error loading data. Please refresh the page.</h2></div>'
    }    
}
function initializeApp(){
    loadUserData();
    loadCartData();
    loadOrdersData();
    loadRecentlyViewed();

    renderCategories();
    showPage("home");
}
document.addEventListener("DOMContentLoaded", function(){
    loadData()
})
function showPage(pageId){
    const pages = document.querySelectorAll(".page")
    pages.forEach(page=> page.classList.add("hidden"))

    const targetPage = document.getElementById(pageId + "Page") 
    if(targetPage){
        targetPage.classList.remove("hidden")
    }

    switch(pageId){
        case "home":
            renderCategories();
            break;
        case "cart":
            renderCart();
            break;
        case "orders":
            renderOrders()
            break;
        case "account":
            loadUserAccountPage()
            break;
    }

}

function toggleSidebar(){
    const sidebar = document.querySelector(".sidebar")
    const overlay = document.querySelector(".sidebar-overlay")

    sidebar.classList.toggle("active")
    overlay.classList.toggle("active")
}
function searchProducts(){
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    if (searchTerm.trim()==="") return;

    filteredProducts = products.filter(product=>
        product.name.toLowerCase().includes(searchTerm) || product.brand.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm)
        
    );
    document.getElementById("categoryTitle").textContent = `Результаты поиска по запросу "${searchTerm}"`;
    populateFilters();
    renderProducts();
    showPage("category")
}
function renderCategories(){
    const categoryGrid = document.getElementById("categoryGrid")
    categoryGrid.innerHTML = "";


    categories.forEach(category => {

        const categoryCard = document.createElement("div");
        categoryCard.className = "category-card";
        categoryCard.onclick =()=> showCategory(category.id);

        let cardContent =`
        <img src="${category.image}" alt="${category.name}">
        <div class="category-card-content">
        <h3>${category.name}</h3>
        <p>${category.description}</p>
        `;

        if(category.isRecentlyViewed){
            if(recentlyViewed.length === 0){
                cardContent += '<p><em>Недавно просмотренных товаров нет.</em></p>'
            }else{
                cardContent += `<p> у вас есть ${recentlyViewed.length}
                Недавно просмотренные товары</p>`
            }  
        }
        cardContent +=`
        <a href="#" class="category-btn">Просмотреть товары</a>
        </div>
        `;

        categoryCard.innerHTML = cardContent;
        categoryGrid.appendChild(categoryCard)
    });
}
function showCategory(categoryId){
    if(categoryId ==="recently-viewed") {
        filteredProducts = products.filter(product => recentlyViewed.includes(product.id))
        document.getElementById("categoryTitle").textContent="Недавно просмотренные товары"
    }else{
        filteredProducts = products.filter(product => product.category===categoryId)
        const category = categories.find(cat => cat.id === categoryId)
        document.getElementById("categoryTitle").textContent= category.name
    }

    populateFilters();
    renderProducts()
    showPage("category")
}
function populateFilters(){
    const brandFilter = document.getElementById("brandFilter")
    const brands = [...new Set(filteredProducts.map(product => product.brand))]
    brandFilter.innerHTML = '<option value="">Бренды</option>';
    brands.forEach(brand=>{
        const option = document.createElement("option")
        option.value= brand;
        option.textContent= brand;
        brandFilter.appendChild(option)
    })
}

function applyFilters(){
    const sortBy = document.getElementById("sortBy").value;
    const maxPrice = parseInt(document.getElementById("priceRange").value)
    const selectedBrand = document.getElementById("brandFilter").value
    
    document.getElementById("priceValue").textContent = "руб" + maxPrice;
    let filtered = filteredProducts.filter(product =>{
        if(product.price> maxPrice) return false;
        if (selectedBrand && product.brand !== selectedBrand)
return false;
        return true;
    })
    switch(sortBy){
        case "price-low":
            filtered.sort((a,b)=> a.price - b.price)
            break;
        case "price-high":
            filtered.sort((a,b)=> b.price-a.price)
            break;
        case "rating":
            filtered.sort((a,b)=> b.rating - a.rating)
            break;
        default:
            break;
    }

    renderProducts(filtered);


}

function renderProducts(products = filteredProducts) {
    const productGrid = document.getElementById("productGrid")
    productGrid.innerHTML = "";

    if (products.length === 0){
        productGrid.innerHTML = '<p>Товары, соответствующие вашему поиску, не найдены.</p>';
        return
    }
    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        productCard.onclick =() => showProduct(product.id)

        productCard.innerHTML= ` 
        <img src="${product.image}" alt="${product.name}">
            <div class="product-card-content">
                <div class="product-brand">${product.brand}</div>
                <h3>${product.name}</h3>
                <div class="product-rating">
                    ${"🌟".repeat(Math.floor(product.rating))}${"♠️".repeat(5-Math.floor(product.rating))}
                    ${product.rating}
            </div>
            <div class="product-price">
            <span class="current-price">${product.price}руб</span>
            <span class="original-price">${product.originalPrice}руб</span>
            <span class="discount">${product.discount}% OFF</span>
            </div>
            </div>
            `;

            productGrid.appendChild(productCard)
            
    })
}

function showProduct(productId){
    const product = products.find(p => p.id === productId);
    if(!product) return

    if(!recentlyViewed.includes(productId)){
        recentlyViewed.unshift(productId);
        if(recentlyViewed.length>10){
            recentlyViewed.pop()
        }
        saveRecentlyViewed()
    }
    const productDetail = document.getElementById("productDetail");
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 7)

    productDetail.innerHTML = `
    <div>
        <img src="${product.image}" alt="${product.name}"
        class="product-image">
    </div>
    <div class="product-info">
        <h1>${product.name}</h1>
        <div class="brand">${product.brand}</div>
        <div class="product-rating">
            ${"🌟".repeat(Math.floor(product.rating))}${"♠️".repeat(5-Math.floor(product.rating))}
                    ${product.rating}/5
        </div>
        <div class="product-price">
            <span class="current-price">${product.price}руб</span>
            <span class="original-price">${product.originalPrice}руб</span>
            <span class="discount">${product.discount}% OFF</span>
        </div>
        <div class="description">${product.description}</div>

        <div class="product-options">
            ${product.colors && product.colors.length > 0 ? `
                <div class="option-group">
                    <label> Цвет:</label>
                    <select id="selectedColor">
                        ${product.colors.map(color=>
                            `<option value="${color}">${color}</option>`
                        ).join("")}
                    </select>
                </div>
                `: ""}
            ${product.sizes&& product.sizes.length > 0 ? `
                <div class="option-group">
                    <label> Размер:</label>
                    <select id="selectedSize">
                        ${product.sizes.map(size=>
                            `<option value="${size}">${size}</option>`
                        ).join("")}
                    </select>
                </div>
                `: ""}
            </div>
            <div class="address-section">
                <h3>Адрес доставки</h3>
                ${currentUser.address ? `
                    <p>${currentUser.address}</p>
                    <button class="btn-secondary"
                    onclick="showPage('account')">Изменить адрес</button>
                    `:`
                    <p>No address added</p>
                    <button class="btn-secondary"
                    onclick="showPage('account')">Добавить адрес</button>
                    `}
            </div>
            <div class="delivery-info">
                <h4>Информация о доставке</h4>
                <p>📅Доставка будет ${deliveryDate.toDateString()}</p>
                <p>🎣Политика возврата в течение 10 дней</p>
                <p>🏦Возможна оплата наличными при доставке.</p>
            </div>

            <div class="product-actions">
                <button class="btn-primary" onclick="addToCart(${product.id})">Добавить в корзину</button>
                <button class="btn-secondary" onclick="buyNow(${product.id})">Купить сейчас</button>
            </div>
        </div>
    `;
    showPage("product")
}

function validateName(name){
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim())
}
function validateEmail(email){
    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function validatePhone(phone) {
    const phoneRegex = /^[+7|8]\d{11}$/;
    return phoneRegex.test(phone.trim())
}


function addToCart(productId, silent = false){
    const product = products.find(p => p.id === productId)
    if(!product) return;
    
    const selectedColor = document.getElementById("selectedColor")?.value || "";
    const selectedSize = document.getElementById("selectedSize")?.value || "";
    const existingItem = cart.find(item =>
        item.id === productId &&
        item.color === selectedColor &&
        item.size === selectedSize
    )
    if (existingItem){
        existingItem.quantity += 1;
    } else {
        cart.push ({
            id:productId,
            name:product.name,
            brand:product.brand,
            price:product.price,
            originalPrice:product.originalPrice,
            discount:product.discount,
            image:product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        })

    }

    updateCartCount();
    saveCartData()
    if(!silent) alert("Товар добавлен в вашу корзину.!")
}
function buyNow(productId){
    addToCart(productId, true);
    showPage("cart")
}
function renderCart(){
    const cartItems = document.getElementById("cartItems");
    const cartSummary = document.getElementById("cartSummary")

    if(cart.length === 0){
        cartItems.innerHTML= '<p> Пожалуйста, заполните раздел карты. <a href="#" onclick="showPage(\'home\')">Продолжить покупки</a></p>';
        cartSummary.innerHTML = '';
        return;
    }
    cartItems.innerHTML = '';
    let totalOriginal = 0;
    let totalDiscounted = 0;

    cart.forEach((item,index)=> {
        const itemTotal = item.price * item.quantity;
        const itemOriginalTotal = item.originalPrice * item.quantity;
        totalOriginal += itemOriginalTotal;
        totalDiscounted += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML =`
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
            <h3>${item.name}</h3>
            <div class="product-brand">${item.brand}</div>
            ${item.color ? `<p>Цвет: ${item.color}</p>`: ""}
            ${item.size ? `<p>Размер: ${item.size}</p>`: ""}
            <div class="product-price">
                <span class="current-price">${item.price}руб</span>
                <span class="original-price">${item.originalPrice}руб</span>
                <span class="discount">${item.discount}% OFF</span>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1"
                onchange="updateQuantity(${index},0,this.value)">
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            <p>Общая сумма: ${itemTotal}руб</p>
        </div>
        <button class="btn-secondary" onclick="removeFromCart(${index})">Удалить</button>
        `;
        cartItems.appendChild(cartItem)
    })

    const deliveryCharges = totalDiscounted > 500 ? 0 : 50;
    const finalTotal = totalDiscounted + deliveryCharges;

    cartSummary.innerHTML = `
    <h3>Информация о ценах</h3>
    <div class="summary-row">
        <span>Общая цена товара:</span>
        <span>${totalOriginal}руб</span>
    </div>
    <div class="summary-row">
        <span>Скидка:</span>
        <span>${totalOriginal - totalDiscounted}руб</span>
    </div>
    <div class="summary-row">
        <span>Стоимость доставки:</span>
        <span>${deliveryCharges === 0 ? "FREE": "руб" + deliveryCharges}</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-row summary-total">
        <span>Общая сумма:</span>
        <span>${finalTotal}руб</span>
    </div>

    <button class="btn-primary" onclick="proceedToCheckout()"
    style="width:100%; margin-top:20px;">
    Оформить заказ
    </button>
    `

}



function updateQuantity(index, change, newValue = null){
    if(newValue !== null){
        cart[index].quantity = Math.max(1, parseInt(newValue) || 1)
    } else {
        cart[index].quantity = Math.max(1, cart[index].quantity + change)
    }

    updateCartCount();
    saveCartData();
    renderCart()
}

function renderOrderSteps(){
    const orderSteps = document.getElementById("orderSteps")

    if(currentOrderSteps === 1){
        if(!currentUser.name || !currentUser.phone || !currentUser.address) {
            orderSteps.innerHTML= `
            <div class="order-form">
                <h2>Шаг 1: Введите свои данные</h2>
                <div class="form-group">
                    <label for="orderName">ФИО</label>
                    <input type="text" id="orderName" value="${currentUser.name}" placeholder="Введите ваше имя">
                </div>
                <div class="form-group">
                    <label for="orderPhone">Номер телефона:</label>
                    <input type="tel" id="orderPhone" value="${currentUser.phone}" placeholder="Введите свой номер телефона">
                </div>
                <div class="form-group">
                    <label for="orderAddress">Адрес:</label>
                    <textarea id="orderAddress" placeholder="Введите ваш полный адрес">${currentUser.address}</textarea>
                </div>
                <button class="btn-primary" onclick="saveOrderDetails()">Перейти к сводке</button>
            </div>       
            `;
        }else{
            currentOrderSteps =2;
            renderOrderSteps()
        }       
    }else if (currentOrderSteps === 2){
        const cartTotal = cart.reduce((total,item)=>total + (item.price * item.quantity), 0)
        const deliveryCharges = cartTotal > 500? 0 : 50;
        const finalTotal = cartTotal + deliveryCharges;

        let cartItemsHtml = '';
        cart.forEach(item=>{
            cartItemsHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <div class="product-brand">${item.brand}</div>
                    ${item.color ? `<p>Color: ${item.color}</p>`: ""}
                    ${item.size ? `<p>Size: ${item.size}</p>`: ""}
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: rub${item.price * item.quantity}</p>
                </div>
            </div>
            `

        })

        orderSteps.innerHTML = `
        <div class="order-form">
            <h2>Шаг 2: Сводка по заказу</h2>
            <div class="address-section">
                <h3>Адрес доставки</h3>
                <p><strong>${currentUser.name}</strong></p>
                <p>${currentUser.phone}</p>
                <p>${currentUser.address}</p>
            </div>

            <h3>Заказ товаров</h3>
            ${cartItemsHtml}

            <div class="cart-summary">
            <div class="summary-row">
                <span> Всего товаров:</span>
                <span>${cartTotal}руб</span>
            </div>
            <div class="summary-row">
                <span> Стоимость доставки:</span>
                <span>rub${deliveryCharges===0 ? "FREE":"руб" + deliveryCharges}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-total">
                <span> Общая сумма:</span>
                <span>${finalTotal}руб</span>
            </div>
        </div>

        <button class="btn-primary"
        onclick="proceedToPayment()">Перейти к оплате</button>
        </div>
        `;
    
    } else if (currentOrderSteps === 3){
        orderSteps.innerHTML = `
        <div class="order-form">
            <h2>Шаг 3: Оплата</h2>
            <div class="payment-options">
                <div class="payment-option">
                    <input type="radio" id="upi"
                    name="payment" value="upi">
                    <label for="upi">Оплата через СБП</label>
                </div>
                <div class="payment-option">
                    <input type="radio" id="card"
                    name="payment" value="card">
                    <label for="card">Кредитная/дебетовая карта</label>
                </div>
                <div class="payment-option">
                    <input type="radio" id="cod"
                    name="payment" value="cod">
                    <label for="cod">Оплата при доставке</label>
                </div>
            </div>
            <button class="btn-primary" onclick="placeOrder()">
            Оформить заказ
            </button>
        </div>
        `
    }
}
function saveOrderDetails(){
    const name = document.getElementById("orderName").value.trim()
    const phone = document.getElementById("orderPhone").value.trim()
    const address = document.getElementById("orderAddress").value.trim()

    if(!name || !phone || !address){
        alert("Пожалуйста, заполните все обязательные поля.")
        return;
    }
    if(!validateName(name)){
        alert('Пожалуйста, напишите своё имя полностью.');
        return
    }
    if(!validatePhone(phone)){
        alert('Пожалуйста, введите свой полный номер мобильного телефона.');
        return
    }

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    saveUserData();

    currentOrderSteps = 2;
    renderOrderSteps()
}

function proceedToPayment(){
    currentOrderSteps = 3;
    renderOrderSteps()
}

function placeOrder(){
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value

    if(!paymentMethod){

        alert("Пожалуйста, выберите способ оплаты.")
        return;
    }

    const orderId = "ORD" + Date.now();
    const orderDate = new Date()
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7)

    const order = {

        id:orderId,
        items:[...cart],
        total: cart.reduce((total,item)=> total + (item.price * item.quantity), 0),
        deliveryCharges : cart.reduce((total,item)=> total + (item.price * item.quantity),0) > 500 ? 0 : 50,
        paymentMethod:paymentMethod,
        orderDate:orderDate,
        deliveryDate:deliveryDate,
        status:"confirmed",
        address:currentUser.address,
        phone:currentUser.phone,
        name:currentUser.name
    };

    orders.push(order)
    saveOrdersData();

    cart=[]
    updateCartCount();
    saveCartData();

    document.getElementById("orderSteps").innerHTML=`
    <div class="order-success">
        <h1>🎊 Заказ успешно оформлен!</h1>
        <p>Номер вашего заказа:<strong>${orderId}</strong></p>
        <p>Ожидаемая дата доставки ${deliveryDate.toLocaleDateString()}</p>
        <button class="btn-primary" onclick="showPage('orders')">Просмотреть мои заказы</button>
        <button class="btn-secondary" onclick="showPage('home')">Продолжить покупки</button>
    </div>
    `;

}

function renderOrders(){
    const ordersList = document.getElementById("orderList")

    if(orders.length === 0){
        ordersList.innerHTML = `<p>Заказы не найдены. <a href="#" 
        onclick="showPage('home')">Start shopping</a></p>`;
        return;
    }
    ordersList.innerHTML = '';

    const sortedOrders = [...orders].sort((a,b)=> new Date(b.orderDate) - new Date(a.orderDate))

    sortedOrders.forEach(order=>{
        const currentDate = new Date();
        const isDeliverd = currentDate > new Date(order.deliveryDate);

        const orderDiv = document.createElement("div")
        orderDiv.className = "order-card";

        let orderItemsHtml = "";
        order.items.forEach(item=>{
            orderItemsHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                <h3>${item.name}</h3>
                <div class="product-brand">${item.brand}</div>
                ${item.color ? `<p>Цвет: ${item.color}</p>`: ""}
                    ${item.size ? `<p>Размер: ${item.size}</p>`: ""}
                    <p>Количество: ${item.quantity}</p>
                    <p>Цена: rub${item.price * item.quantity}</p>
                </div>
            </div>
            `;
        })

        orderDiv.innerHTML = `
        <div class="order-header" onclick="toggleOrderDetails('${order.id}')">
            <div class="order-summary">
                <h3> Номер заказ:${order.id}</h3>
                <span class="status-badge ${isDeliverd ? "Доставлено" : "on-way"}">
                    ${isDeliverd ? "Доставлено" : "В пути"}
                </span>
            </div>
            <div class= "order-meta">
                <p><strong>Дата заказа:</strong>${order.orderDate.toLocaleDateString()}</p>
                <p><strong>Общий:</strong>${order.total + order.deliveryCharges}</p>
                <p><strong>Товары:</strong>${order.items.length} item${order.items.length> 1 ? "s" : ""}</p>
            </div>
            <div class="dropdown-arrow">
                <span class="arrow-icon">🔻</span>
            </div>
        </div>


        <div class="order-details" id="details-${order.id}"
        style="display: none;">
            <div class = "order-info">
                <p><strong>Дата доставки:</strong> ${order.deliveryDate.toLocaleDateString()}</p>
                <p><strong>Способ оплаты:</strong> ${order.paymentMethod.toUpperCase()}</p> 

                <div class="address-section">
                    <h4>Адрес доставки: </h4>
                    <p>${order.name}</p>
                    <p>${order.phone}</p>
                    <p>${order.address}</p>
                </div>    
                <h4>Заказать товары: </h4>
                ${orderItemsHtml}
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Всего товаров:</span>
                        <span>${order.total}</span>
                    </div>
                    <div class="summary-row">
                        <span>Стоимость доставки:</span>
                        <span>${order.deliveryCharges === 0 ? "FREE" : "руб" + order.deliveryCharges}</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row summary-total">
                        <span>Оплаченные товары:</span>
                        <span>${order.total + order.deliveryCharges}</span>
                    </div>
                </div>
            </div>
        </div>   
        `;
        ordersList.appendChild(orderDiv);
    })
}

function toggleOrderDetails(orderId) {
    const detailsDiv = document.getElementById(`details-${orderId}`)
    const arrowIcon = detailsDiv.previousElementSibling.querySelector(".arrow-icon")

    if(detailsDiv.style.display === "none"){
        detailsDiv.style.display = "block";
        arrowIcon.style.transform = "rotate(180deg)"
    } else{
        detailsDiv.style.display ="none";
        arrowIcon.style.transform = "rotate(0deg)"
    }
}

function saveOrdersData(){
    localStorage.setItem("ordersData",JSON.stringify(orders))
}

function saveUserData(){
    localStorage.setItem("userData",JSON.stringify(currentUser))
}
function loadUserAccountPage(){
    document.getElementById("userName").value = currentUser.name || "";
    document.getElementById("userEmail").value = currentUser.email || "";
    document.getElementById("userPhone").value = currentUser.phone || "";
    document.getElementById("userAddress").value = currentUser.address || "";
}

function saveUserInfo(){
    const name = document.getElementById("userName").value.trim()
    const email = document.getElementById("userEmail").value.trim()
    const phone = document.getElementById("userPhone").value.trim()
    const address = document.getElementById("userAddress").value.trim()

    if(name && !validateName(name)){
        alert('Пожалуйста, напишите своё имя полностью');
        return
    }
    if(email && !validateEmail(email)){
        alert('Пожалуйста, напишите своё email');
        return
    }
    if(phone && !validatePhone(phone)){
        alert('Пожалуйста, введите свой номер только цифрами.');
        return
    }
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.address = address;

    saveUserData()
    alert("Информация успешно сохранена.!!!! ")
}


function removeFromCart(index){
    cart.splice(index, 1);
    updateCartCount();
    saveCartData();
    renderCart();
}

function proceedToCheckout(){
    currentOrderSteps = 1;
    showPage('order');
    renderOrderSteps();
}

function updateCartCount(){
    const cartCount = cart.reduce((total,item)=> total + item.quantity,0)
    document.getElementById("cartCount").textContent = cartCount
}

function saveCartData(){
    localStorage.setItem("cartData",JSON.stringify(cart))
}

function saveRecentlyViewed(){
    localStorage.setItem("recentlyViewedData",JSON.stringify(recentlyViewed))
}




function loadUserData(){
    const userData = localStorage.getItem("userData")
    if(userData){
        currentUser = JSON.parse(userData)
    }
}
function loadCartData(){
    const cartData = localStorage.getItem("cartData")
    if(cartData){
        cart = JSON.parse(cartData)
        updateCartCount()
    }
}
function loadOrdersData(){
    const ordersData = localStorage.getItem("ordersData")
    if(ordersData){
        orders = JSON.parse(ordersData)
    }
}
function loadRecentlyViewed(){
    const recentlyViewedData = localStorage.getItem("recentlyViewedData")
    if(recentlyViewedData){
        recentlyViewed = JSON.parse(recentlyViewedData)
    }
}