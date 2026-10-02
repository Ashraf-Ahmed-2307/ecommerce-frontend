const contextPath = 'http://localhost:8090';
const apiBase = `${contextPath}/rest/api/v1/catalogues`;

function appendProductRow(tableBody, values) {
    const row = document.createElement('tr');

    for (const value of values) {
        const cell = document.createElement('td');

        cell.textContent = value;
        row.appendChild(cell);
    }

    tableBody.appendChild(row);
}

async function loadCategoryOptions() {
    const container = document.getElementById('category-options');
    const status = document.getElementById('category-options-status');

    status.textContent = 'Loading categories...';

    try {
        const response = await fetch(`${apiBase}/categories`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const categories = await response.json();

        container.replaceChildren();

        for (const category of categories) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.name = 'categoryIds';
            checkbox.value = category.id;

            label.append(checkbox, ` ${category.name} `);
            container.appendChild(label);
        }

        status.textContent = categories.length === 0 ? 'No categories available.' : '';
    } catch (error) {
        status.textContent = `Could not load categories: ${error.message}`;
    }
}

async function addProduct() {
    const form = document.querySelector('form');
    const status = document.getElementById('add-product-status');

    status.textContent = 'Adding product...';

    try {
        const response = await fetch(apiBase, {
            method: 'POST',
            body: new URLSearchParams(new FormData(form))
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.textContent = 'Product added successfully.';
            form.reset();
        } else {
            status.textContent = 'Could not add the product.';
        }
    } catch (error) {
        status.textContent = `Request failed: ${error.message}`;
    }
}

async function searchProduct() {
    const id = document.getElementById('productid').value.trim();
    const status = document.getElementById('product-search-status');
    const details = document.getElementById('product-details');

    details.hidden = true;

    status.textContent = 'Searching...';

    try {
        const response = await fetch(`${apiBase}?productId=${encodeURIComponent(id)}`);

        if (response.status === 404) {
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const product = await response.json();

        document.getElementById('result-id').textContent =
            product.id ?? product.productId ?? id;
        document.getElementById('result-name').textContent =
            product.name ?? '';
        document.getElementById('result-brand').textContent =
            product.brand ?? '';
        document.getElementById('result-description').textContent =
            product.description ?? '';
        document.getElementById('result-status').textContent =
            product.status ?? '';

        details.hidden = false;
        status.textContent = '';
    } catch (error) {
        status.textContent = `Could not load product: ${error.message}`;
    }
}

async function viewAllProducts() {
    const status = document.getElementById('products-status');
    const table = document.getElementById('products-table');
    const tableBody = document.getElementById('products-body');

    status.textContent = 'Loading products...';

    try {
        const response = await fetch(`${apiBase}/viewall`);

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
            appendProductRow(tableBody, [
                product.id,
                product.name,
                product.brand ?? '',
                product.description ?? '',
                product.status
            ]);
        }

        table.hidden = false;
        status.textContent = '';
    } catch (error) {
        status.textContent = `Could not load products: ${error.message}`;
    }
}

async function updateProductName() {
    const id = document.getElementById('update-productid').value.trim();
    const updatedName = document.getElementById('update-name').value.trim();
    const status = document.getElementById('update-product-status');

    if (!id || !updatedName) {
        status.textContent = 'Enter the product ID and the new name.';
        return;
    }

    status.textContent = 'Updating...';

    try {
        const params = new URLSearchParams({ productId: id, updatedName: updatedName });
        const response = await fetch(`${apiBase}?${params}`, { method: 'PUT' });

        if (response.status === 404) {
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.textContent = 'Product name updated successfully.';
            document.getElementById('update-form').reset();
        } else {
            status.textContent = 'Could not update the product.';
        }
    } catch (error) {
        status.textContent = `Request failed: ${error.message}`;
    }
}

async function removeProduct() {
    const id = document.getElementById('delete-productid').value.trim();
    const status = document.getElementById('delete-product-status');

    if (!id) {
        status.textContent = 'Enter the product ID.';
        return;
    }

    if (!confirm(`Delete product ${id}? This cannot be undone.`)) {
        return;
    }

    status.textContent = 'Deleting...';

    try {
        const response = await fetch(`${apiBase}?productId=${encodeURIComponent(id)}`, { method: 'DELETE' });

        if (response.status === 404) {
            status.textContent = `No product found with ID ${id}.`;
            return;
        }

        if (response.status === 409) {
            status.textContent = 'This product cannot be deleted because it is in use.';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.text()).trim();

        if (result === 'success') {
            status.textContent = 'Product deleted successfully.';
            document.getElementById('delete-form').reset();
        } else {
            status.textContent = 'Could not delete the product.';
        }
    } catch (error) {
        status.textContent = `Request failed: ${error.message}`;
    }
}

async function loadCategories() {
    const status = document.getElementById('category-status');
    const list = document.getElementById('category-list');

    status.textContent = 'Loading categories...';

    try {
        const response = await fetch(`${apiBase}/categories`);

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
            const item = document.createElement('li');
            const link = document.createElement('a');

            link.href = `category-products.html?categoryId=${category.id}&name=${encodeURIComponent(category.name)}`;
            link.textContent = category.name;
            item.appendChild(link);

            if (category.description) {
                item.append(` - ${category.description}`);
            }

            list.appendChild(item);
        }

        status.textContent = '';
    } catch (error) {
        status.textContent = `Could not load categories: ${error.message}`;
    }
}

async function loadCategoryProducts() {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('categoryId');
    const categoryName = params.get('name');

    const heading = document.getElementById('category-heading');
    const status = document.getElementById('products-status');
    const table = document.getElementById('products-table');
    const tableBody = document.getElementById('products-body');

    if (!categoryId) {
        status.textContent = 'No category selected.';
        return;
    }

    if (categoryName) {
        heading.textContent = categoryName;
    }

    status.textContent = 'Loading products...';

    try {
        const response = await fetch(`${apiBase}/categories/${encodeURIComponent(categoryId)}/products`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const products = await response.json();

        tableBody.replaceChildren();

        if (products.length === 0) {
            table.hidden = true;
            status.textContent = 'No products found in this category.';
            return;
        }

        for (const product of products) {
            appendProductRow(tableBody, [
                product.id,
                product.name,
                product.brand ?? '',
                product.description ?? ''
            ]);
        }

        table.hidden = false;
        status.textContent = '';
    } catch (error) {
        status.textContent = `Could not load products: ${error.message}`;
    }
}