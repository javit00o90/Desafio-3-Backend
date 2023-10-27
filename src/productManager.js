const fs = require('fs').promises;
const express = require('express');

class ProductManager {
    constructor() {
        this.filePath = './files/products.json';
    }

    async initializeProductFile() {
        const defaultData = [];
        await this.saveProductsToJSON(defaultData);
    }

    async addProduct(title, description, price, thumbnail, code, stock) {
        try {
            let data;
            let products = [];

            try {
                data = await fs.readFile(this.filePath, 'utf8');
                products = JSON.parse(data);
            } catch (error) {
                await this.initializeProductFile();
                data = await fs.readFile(this.filePath, 'utf8');
                products = JSON.parse(data);
            }

            const existingProduct = products.find(product => product.code === code);
            if (existingProduct) {
                return "Ya existe un producto con ese código.";
            }

            const productIdCounter = Math.max(...products.map(product => product.id), 0) + 1;
            const newProduct = {
                id: productIdCounter,
                title,
                description,
                price,
                thumbnail,
                code,
                stock,
            };

            products.push(newProduct);
            await this.saveProductsToJSON(products);
            return "Producto agregado correctamente.";
        } catch (error) {
            console.error('Error agregando producto:', error.message);
            return "Error agregando producto.";
        }
    }

    async getProducts() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            if (!data) {
                await this.saveProductsToJSON([]);
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al leer producto desde JSON:', error.message);
            return [];
        }
    }

    async getProductById(id) {
        const products = await this.getProducts();
        const product = products.find(product => product.id === id);
        if (product) {
            return product;
        } else {
            return "Producto no encontrado.";
        }
    }

    async updateProduct(id, updates) {
        const products = await this.getProducts();
        const productIndex = products.findIndex(product => product.id === id);
        if (productIndex === -1) {
            return "Producto no encontrado.";
        }

        products[productIndex] = {
            ...products[productIndex],
            ...updates,
            id,
        };

        await this.saveProductsToJSON(products);
        return "Producto actualizado correctamente.";
    }

    async saveProductsToJSON(products) {
        try {
            const data = JSON.stringify(products, null, 2);
            await fs.writeFile(this.filePath, data);
        } catch (error) {
            console.error('Error guardando producto al JSON:', error.message);
        }
    }

    async deleteProduct(id) {
        const products = await this.getProducts();
        const productIndex = products.findIndex(product => product.id === id);
        if (productIndex === -1) {
            return "Producto no encontrado.";
        }

        setTimeout(async () => {
            products.splice(productIndex, 1);

            await this.saveProductsToJSON(products);

            console.log(`Producto con ID ${id} eliminado.`);
        }, 2000);

        return "Eliminando producto...";
    }
}


const productManager = new ProductManager();
const app = express();
const port = 3000;

app.use(express.json());

async function initializeAndAddProduct() {
    console.log(await productManager.addProduct("Azucar", "Description 1", 19.99, "image1.jpg", "P001", 100));
    console.log(await productManager.addProduct("Yerba", "Description 2", 29.99, "image2.jpg", "P002", 50));
    console.log(await productManager.addProduct("Leche", "Description 3", 10.99, "image3.jpg", "P003", 20));
    console.log(await productManager.addProduct("Aceite", "Description 4", 15.99, "image4.jpg", "P004", 15));
    console.log(await productManager.addProduct("Galletitas", "Description 5", 16.99, "image5.jpg", "P005", 35));
    console.log(await productManager.addProduct("Vinagre", "Description 6", 13.99, "image6.jpg", "P006", 11));
    console.log(await productManager.addProduct("Arroz", "Description 7", 12.99, "image7.jpg", "P007", 12));
    console.log(await productManager.addProduct("Fideos", "Description 8", 11.99, "image8.jpg", "P008", 25));
}
initializeAndAddProduct();

//Gets de servidor
app.get('/products', async (req, res) => {
    const products = await productManager.getProducts();
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    if (limit) {
        const limitedProducts = products.slice(0, limit);
        res.json(limitedProducts);
    } else {
        res.json(products);
    }
});

app.get('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const product = await productManager.getProductById(productId);
    res.json(product);
});

app.delete('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const result = await productManager.deleteProduct(productId);
    res.json({ message: result });
});

app.use((req, res) => {
    res.status(404).json({ message: "Página no encontrada" });
});

//Listen del servidor
app.listen(port, () => {
    console.log(`Servidor encendido y escuchando el puerto ${port}`);
});
