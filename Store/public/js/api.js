/* ============================================
   COMPUNIC STORE - API CLIENT
   ============================================ */

const API_BASE = 'http://localhost:3001/api/store';

const StoreAPI = {
    /**
     * Obtener productos del catálogo
     * @param {Object} filtros - Filtros opcionales (categoria, marca, busqueda)
     * @returns {Promise<Array>} Lista de productos
     */
    async obtenerProductos(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.categoria) params.append('categoria', filtros.categoria);
            if (filtros.marca) params.append('marca', filtros.marca);
            if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

            const url = `${API_BASE}/productos${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.productos || [];
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    },

    /**
     * Obtener detalle de un producto
     * @param {number} id - ID del producto
     * @returns {Promise<Object>} Datos del producto
     */
    async obtenerProducto(id) {
        try {
            const response = await fetch(`${API_BASE}/productos/${id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.producto;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            throw error;
        }
    },

    /**
     * Obtener categorías disponibles
     * @returns {Promise<Array>} Lista de categorías
     */
    async obtenerCategorias() {
        try {
            const response = await fetch(`${API_BASE}/categorias`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.categorias || [];
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    },

    /**
     * Obtener marcas disponibles
     * @returns {Promise<Array>} Lista de marcas
     */
    async obtenerMarcas() {
        try {
            const response = await fetch(`${API_BASE}/marcas`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.marcas || [];
        } catch (error) {
            console.error('Error al obtener marcas:', error);
            throw error;
        }
    },

    /**
     * Crear un nuevo pedido
     * @param {Object} datosCliente - Datos del cliente
     * @param {Array} productos - Lista de productos
     * @param {number} total - Total del pedido
     * @returns {Promise<Object>} Resultado del pedido
     */
    async crearPedido(datosCliente, productos, total) {
        try {
            const response = await fetch(`${API_BASE}/pedidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cliente: datosCliente,
                    productos: productos,
                    total: total
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error al crear pedido:', error);
            throw error;
        }
    },

    /**
     * Obtener detalles de un pedido
     * @param {number} id - ID del pedido
     * @returns {Promise<Object>} Detalles del pedido
     */
    async obtenerPedido(id) {
        try {
            const response = await fetch(`${API_BASE}/pedidos/${id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.pedido;
        } catch (error) {
            console.error('Error al obtener pedido:', error);
            throw error;
        }
    },

    /**
     * Validar stock disponible
     * @param {number} idProducto - ID del producto
     * @param {number} cantidad - Cantidad solicitada
     * @returns {Promise<boolean>} true si hay stock suficiente
     */
    async validarStock(idProducto, cantidad) {
        try {
            const response = await fetch(`${API_BASE}/validar-stock/${idProducto}/${cantidad}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.disponible;
        } catch (error) {
            console.error('Error al validar stock:', error);
            throw error;
        }
    }
};
