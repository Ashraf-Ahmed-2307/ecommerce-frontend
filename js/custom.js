const contextPath = 'http://localhost:8090';

// Status message styles (Bootstrap alert classes).
const statusInfo = 'status alert alert-info';
const statusSuccess = 'status alert alert-success';
const statusError = 'status alert alert-danger';

// Badge colour for each product status.
const statusBadgeClass = {
    ACTIVE: 'text-bg-success',
    DRAFT: 'text-bg-secondary',
    INACTIVE: 'text-bg-warning',
    DISCONTINUED: 'text-bg-danger'
};

// Add product page: show the active categories as checkboxes.
async function loadCategoryOptions() {
    const container = document.getElementById('category-options');
    const status = document.getElementById('category-options-status');

    status.className = statusInfo;
    status.textContent = 'Loading categories...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/categories`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const categories = await response.json();

        container.replaceChildren();

        for (const category of categories) {
            const wrapper = document.createElement('div');
            const checkbox = document.createElement('input');
            const label = document.createElement('label');

            wrapper.className = 'form-check form-check-inline';

            checkbox.className = 'form-check-input';
            checkbox.type = 'checkbox';
            checkbox.name = 'categoryIds';
            checkbox.value = category.id;
            checkbox.id = `category-option-${category.id}`;

            label.className = 'form-check-label';
            label.htmlFor = checkbox.id;
            label.textContent = category.name;

            wrapper.append(checkbox, label);
            container.appendChild(wrapper);
        }

        status.textContent = categories.length === 0 ? 'No categories available.' : '';
    } catch (error) {
        status.className = statusError;
        status.textContent = `Could not load categories: ${error.message}`;
    }
}

// POST: add a product (the checked categories are sent as categoryIds).
async function addProduct() {
    const form = document.querySelector('form');
    const status = document.getElementById('add-product-status');

    status.className = statusInfo;
    status.textContent = 'Adding product...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues`, {
            method: 'POST',
            body: new URLSearchParams(new FormData(form))
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.className = statusSuccess;
            status.textContent = 'Product added successfully.';
            form.reset();
        } else {
            status.className = statusError;
            status.textContent = 'Could not add the product.';
        }
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}

// POST /{productId}/images: add an image reference (path or URL) to a product.
async function addProductImage() {
    const productId = document.getElementById('image-productid').value.trim();
    const imageUrl = document.getElementById('image-url').value.trim();
    const altText = document.getElementById('image-alt').value.trim();
    const status = document.getElementById('add-image-status');

    if (!productId || !imageUrl || !altText) {
        status.className = statusError;
        status.textContent = 'Enter the product ID, the image path or URL, and the alt text.';
        return;
    }

    status.className = statusInfo;
    status.textContent = 'Adding image...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/${encodeURIComponent(productId)}/images`, {
            method: 'POST',
            body: new URLSearchParams({ imageUrl: imageUrl, altText: altText })
        });

        if (response.status === 404) {
            status.className = statusError;
            status.textContent = `No product found with ID ${productId}.`;
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.className = statusSuccess;
            status.textContent = 'Image added successfully.';
            document.getElementById('add-image-form').reset();
        } else {
            status.className = statusError;
            status.textContent = 'Could not add the image.';
        }
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}

// GET /{productId}/images: show every image of a product, cover image first.
async function loadProductImages(productId) {
    const container = document.getElementById('result-images');

    container.replaceChildren();

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/${encodeURIComponent(productId)}/images`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const images = await response.json();

        if (images.length === 0) {
            container.textContent = 'No images for this product.';
            return;
        }

        for (const image of images) {
            const picture = document.createElement('img');

            picture.className = 'gallery-image';
            picture.src = image.imageUrl;
            picture.alt = image.altText;

            // The first image (lowest display order) is the cover image.
            if (image.displayOrder === images[0].displayOrder) {
                picture.classList.add('cover-image');
            }

            container.appendChild(picture);
        }
    } catch (error) {
        container.textContent = `Could not load images: ${error.message}`;
    }
}

// GET: search one product by ID.
async function searchProduct() {
    const id = document.getElementById('productid').value.trim();
    const status = document.getElementById('product-search-status');
    const details = document.getElementById('product-details');

    details.hidden = true;

    status.className = statusInfo;
    status.textContent = 'Searching...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues?productId=${encodeURIComponent(id)}`);

        if (response.status === 404) {
            status.className = statusError;
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const product = await response.json();
        const badge = document.getElementById('result-status');

        document.getElementById('result-id').textContent =
            product.id ?? product.productId ?? id;
        document.getElementById('result-name').textContent =
            product.name ?? '';
        document.getElementById('result-brand').textContent =
            product.brand ?? '';
        document.getElementById('result-description').textContent =
            product.description ?? '';

        badge.textContent = product.status ?? '';
        badge.className = `badge ${statusBadgeClass[product.status] ?? 'text-bg-secondary'}`;

        details.hidden = false;
        status.textContent = '';

        await loadProductImages(product.id ?? id);
    } catch (error) {
        status.className = statusError;
        status.textContent = `Could not load product: ${error.message}`;
    }
}

// GET /viewall: list every product with its status.
async function viewAllProducts() {
    const status = document.getElementById('products-status');
    const table = document.getElementById('products-table');
    const tableBody = document.getElementById('products-body');

    status.className = statusInfo;
    status.textContent = 'Loading products...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/viewall`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const products = await response.json();

        tableBody.replaceChildren();

        if (products.length === 0) {
            table.hidden = true;
            status.textContent = 'No products found.';
            return;
        }

        for (const product of products) {
            const row = document.createElement('tr');
            const imageCell = document.createElement('td');
            const statusCell = document.createElement('td');
            const badge = document.createElement('span');

            if (product.coverImageUrl) {
                const picture = document.createElement('img');

                picture.className = 'thumb';
                picture.src = product.coverImageUrl;
                picture.alt = product.coverImageAlt ?? product.name;
                imageCell.appendChild(picture);
            } else {
                imageCell.className = 'text-muted small';
                imageCell.textContent = 'No image';
            }

            row.appendChild(imageCell);

            const values = [product.id, product.name, product.brand ?? '', product.description ?? ''];

            for (const value of values) {
                const cell = document.createElement('td');

                cell.textContent = value;
                row.appendChild(cell);
            }

            badge.className = `badge ${statusBadgeClass[product.status] ?? 'text-bg-secondary'}`;
            badge.textContent = product.status;
            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            tableBody.appendChild(row);
        }

        table.hidden = false;
        status.textContent = '';
    } catch (error) {
        status.className = statusError;
        status.textContent = `Could not load products: ${error.message}`;
    }
}

// PUT: rename a product.
async function updateProductName() {
    const id = document.getElementById('update-productid').value.trim();
    const updatedName = document.getElementById('update-name').value.trim();
    const status = document.getElementById('update-product-status');

    if (!id || !updatedName) {
        status.className = statusError;
        status.textContent = 'Enter the product ID and the new name.';
        return;
    }

    status.className = statusInfo;
    status.textContent = 'Updating...';

    try {
        const params = new URLSearchParams({ productId: id, updatedName: updatedName });
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues?${params}`, { method: 'PUT' });

        if (response.status === 404) {
            status.className = statusError;
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.className = statusSuccess;
            status.textContent = 'Product name updated successfully.';
            document.getElementById('update-form').reset();
        } else {
            status.className = statusError;
            status.textContent = 'Could not update the product.';
        }
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}

// DELETE: remove a product.
async function removeProduct() {
    const id = document.getElementById('delete-productid').value.trim();
    const status = document.getElementById('delete-product-status');

    if (!id) {
        status.className = statusError;
        status.textContent = 'Enter the product ID.';
        return;
    }

    if (!confirm(`Delete product ${id}? This cannot be undone.`)) {
        return;
    }

    status.className = statusInfo;
    status.textContent = 'Deleting...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues?productId=${encodeURIComponent(id)}`, { method: 'DELETE' });

        if (response.status === 404) {
            status.className = statusError;
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (response.status === 409) {
            status.className = statusError;
            status.textContent = 'This product cannot be deleted because it is in use.';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.className = statusSuccess;
            status.textContent = 'Product deleted successfully.';
            document.getElementById('delete-form').reset();
        } else {
            status.className = statusError;
            status.textContent = 'Could not delete the product.';
        }
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}

// Landing page: show the active categories as cards.
async function loadCategories() {
    const status = document.getElementById('category-status');
    const list = document.getElementById('category-list');

    status.className = statusInfo;
    status.textContent = 'Loading categories...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/categories`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const categories = await response.json();

        list.replaceChildren();

        if (categories.length === 0) {
            status.textContent = 'No categories available.';
            return;
        }

        for (const category of categories) {
            const column = document.createElement('div');
            const card = document.createElement('div');
            const body = document.createElement('div');
            const badge = document.createElement('div');
            const title = document.createElement('h5');
            const description = document.createElement('p');
            const link = document.createElement('a');

            column.className = 'col';
            card.className = 'card category-card h-100 shadow-sm';
            body.className = 'card-body d-flex flex-column';

            badge.className = 'category-badge mb-3';
            badge.textContent = category.name.charAt(0).toUpperCase();

            title.className = 'card-title h5';
            title.textContent = category.name;

            description.className = 'card-text text-muted flex-grow-1';
            description.textContent = category.description ?? '';

            link.className = 'stretched-link fw-semibold text-decoration-none';
            link.href = `category-products.html?categoryId=${category.id}&name=${encodeURIComponent(category.name)}`;
            link.textContent = 'Browse products \u2192';

            body.append(badge, title, description, link);
            card.appendChild(body);
            column.appendChild(card);
            list.appendChild(column);
        }

        status.textContent = '';
    } catch (error) {
        status.className = statusError;
        status.textContent = `Could not load categories: ${error.message}`;
    }
}

// Category page: show the active products of the category given in the URL as cards.
async function loadCategoryProducts() {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('categoryId');
    const categoryName = params.get('name');

    const heading = document.getElementById('category-heading');
    const status = document.getElementById('products-status');
    const grid = document.getElementById('products-grid');

    if (!categoryId) {
        status.className = statusError;
        status.textContent = 'No category selected.';
        return;
    }

    if (categoryName) {
        heading.textContent = categoryName;
    }

    status.className = statusInfo;
    status.textContent = 'Loading products...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/catalogues/categories/${encodeURIComponent(categoryId)}/products`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const products = await response.json();

        grid.replaceChildren();

        if (products.length === 0) {
            status.textContent = 'No products found in this category.';
            return;
        }

        for (const product of products) {
            const column = document.createElement('div');
            const card = document.createElement('div');
            const body = document.createElement('div');
            const title = document.createElement('h5');
            const description = document.createElement('p');
            const footer = document.createElement('div');

            column.className = 'col';
            card.className = 'card product-card h-100 shadow-sm';

            if (product.coverImageUrl) {
                const picture = document.createElement('img');

                picture.className = 'card-img-top product-image';
                picture.src = product.coverImageUrl;
                picture.alt = product.coverImageAlt ?? product.name;
                card.appendChild(picture);
            } else {
                const placeholder = document.createElement('div');

                placeholder.className = 'product-placeholder';
                placeholder.textContent = 'No image';
                card.appendChild(placeholder);
            }

            body.className = 'card-body';

            if (product.brand) {
                const brand = document.createElement('span');

                brand.className = 'badge brand-badge mb-2';
                brand.textContent = product.brand;
                body.appendChild(brand);
            }

            title.className = 'card-title h5';
            title.textContent = product.name;

            description.className = 'card-text text-muted line-clamp-3';
            description.textContent = product.description ?? '';

            footer.className = 'card-footer bg-white border-0 small text-muted';
            footer.textContent = `Product ID: ${product.id}`;

            body.append(title, description);
            card.append(body, footer);
            column.appendChild(card);
            grid.appendChild(column);
        }

        status.textContent = '';
    } catch (error) {
        status.className = statusError;
        status.textContent = `Could not load products: ${error.message}`;
    }
}

// POST /auth/register: create a customer account.
async function signUp() {
    const form = document.getElementById('sign-up-form');
    const status = document.getElementById('sign-up-status');
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        status.className = statusError;
        status.textContent = 'The passwords do not match.';
        return;
    }

    status.className = statusInfo;
    status.textContent = 'Creating your account...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/auth/register`, {
            method: 'POST',
            body: new URLSearchParams(new FormData(form))
        });

        if (response.status === 201) {
            status.className = statusSuccess;
            status.textContent = 'Account created. Taking you to the sign in page...';
            form.reset();

            setTimeout(() => {
                window.location.href = 'customer-sign-in.html';
            }, 1500);
            return;
        }

        // 400 (invalid details) and 409 (username or email already used) carry a readable message.
        if (response.status === 400 || response.status === 409) {
            status.className = statusError;
            status.textContent = (await response.text()).trim();
            return;
        }

        throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}

// POST /auth/login: sign in; the server keeps the user in a session cookie.
async function signIn() {
    const form = document.getElementById('sign-in-form');
    const status = document.getElementById('sign-in-status');

    status.className = statusInfo;
    status.textContent = 'Signing in...';

    try {
        const response = await fetch(`${contextPath}/rest/api/v1/auth/login`, {
            method: 'POST',
            credentials: 'include',
            body: new URLSearchParams(new FormData(form))
        });

        // One generic message for every kind of failed login.
        if (response.status === 401) {
            status.className = statusError;
            status.textContent = 'Invalid username or password.';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const user = await response.json();

        status.className = statusSuccess;
        status.textContent = `Welcome back, ${user.firstName}! Taking you to the store...`;
        form.reset();

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        status.className = statusError;
        status.textContent = `Request failed: ${error.message}`;
    }
}