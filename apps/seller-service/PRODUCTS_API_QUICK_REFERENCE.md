# Products API - Quick Reference

## Base URL
```
http://localhost:3003
```

## Endpoints

| Method | Endpoint         | Description            | Body Type            |
|--------|------------------|------------------------|----------------------|
| POST   | /products        | Create product         | multipart/form-data  |
| GET    | /products        | Get all products       | -                    |
| GET    | /products/:id    | Get product by ID      | -                    |
| PUT    | /products/:id    | Update product         | multipart/form-data  |
| DELETE | /products/:id    | Delete product         | -                    |
| GET    | /uploads/products/:filename | Access image | -             |

---

## 1. CREATE PRODUCT

### Request
```bash
POST /products
Content-Type: multipart/form-data
```

### Body Parameters
```
name        : string   (required) - max 255 characters
description : string   (optional)
price       : number   (required) - >= 0
sellerId    : UUID     (optional) - default seller if not provided
image       : file     (optional) - jpg, jpeg, png, gif, webp (max 10MB)
```

### Response (201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop",
  "price": "1299.99",
  "imagePath": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
  "sellerId": "00000000-0000-0000-0000-000000000001",
  "createdAt": "2026-03-16T10:30:00.000Z",
  "updatedAt": "2026-03-16T10:30:00.000Z"
}
```

### cURL Example
```bash
curl -X POST http://localhost:3003/products \
  -F "name=Laptop Dell XPS 13" \
  -F "description=High-performance laptop" \
  -F "price=1299.99" \
  -F "image=@laptop.png"
```

---

## 2. GET ALL PRODUCTS

### Request
```bash
GET /products
```

### Response (200)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Laptop Dell XPS 13",
    "price": "1299.99",
    "imagePath": "/uploads/products/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
    ...
  }
]
```

### cURL Example
```bash
curl http://localhost:3003/products
```

---

## 3. GET PRODUCT BY ID

### Request
```bash
GET /products/:id
```

### Response (200)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Laptop Dell XPS 13",
  ...
}
```

### cURL Example
```bash
curl http://localhost:3003/products/550e8400-e29b-41d4-a716-446655440000
```

---

## 4. UPDATE PRODUCT

### Request
```bash
PUT /products/:id
Content-Type: multipart/form-data
```

### Body Parameters (all optional)
```
name        : string
description : string
price       : number
image       : file - jpg, jpeg, png, gif, webp (max 10MB)
```

### Response (200)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name",
  "price": "1499.99",
  ...
}
```

### cURL Example
```bash
curl -X PUT http://localhost:3003/products/550e8400-e29b-41d4-a716-446655440000 \
  -F "name=Laptop Dell XPS 15" \
  -F "price=1499.99" \
  -F "image=@new-image.png"
```

---

## 5. DELETE PRODUCT

### Request
```bash
DELETE /products/:id
```

### Response (204 No Content)
```
(empty body)
```

### cURL Example
```bash
curl -X DELETE http://localhost:3003/products/550e8400-e29b-41d4-a716-446655440000
```

---

## DTOs

### CreateProductDto
```typescript
{
  name: string;         // Required, max 255
  description?: string; // Optional
  price: number;        // Required, >= 0
  sellerId?: string;    // Optional, UUID
}
```

### UpdateProductDto
```typescript
{
  name?: string;        // Optional, max 255
  description?: string; // Optional
  price?: number;       // Optional, >= 0
}
```

---

## Image Upload

### Specifications
- **Max Size:** 10 MB
- **Formats:** jpg, jpeg, png, gif, webp
- **Storage:** `./uploads/products/`
- **Naming:** UUID v4 + original extension
- **Example:** `550e8400-e29b-41d4-a716-446655440000.png`

### Access Images
```
http://localhost:3003/uploads/products/{uuid}.{ext}
```

### Features
- ✅ UUID-based filenames
- ✅ Automatic cleanup on update
- ✅ Automatic cleanup on delete
- ✅ File type validation
- ✅ File size validation

---

## Frontend Example (JavaScript)

### Create Product with Image
```javascript
const formData = new FormData();
formData.append('name', 'Laptop Dell XPS 13');
formData.append('description', 'High-performance laptop');
formData.append('price', '1299.99');
formData.append('image', fileInput.files[0]);

fetch('http://localhost:3003/products', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Display Product with Image
```javascript
fetch('http://localhost:3003/products')
  .then(res => res.json())
  .then(products => {
    products.forEach(product => {
      const imageUrl = product.imagePath 
        ? `http://localhost:3003${product.imagePath}`
        : '/placeholder.png';
      // Use imageUrl in <img src={imageUrl} />
    });
  });
```

---

## Error Codes

| Code | Description           | When                              |
|------|-----------------------|-----------------------------------|
| 201  | Created               | Product created successfully      |
| 200  | OK                    | Operation successful              |
| 204  | No Content            | Product deleted                   |
| 400  | Bad Request           | Invalid data/UUID/file            |
| 404  | Not Found             | Product not found                 |
| 413  | Payload Too Large     | Image > 10MB                      |
| 415  | Unsupported Media     | Invalid image format              |

---

## Swagger UI

Interactive API documentation:
```
http://localhost:3003/api/docs
```

---

## Notes

1. **UUID Filenames:** Every uploaded image gets a unique UUID filename
2. **Automatic Cleanup:** Old images are deleted automatically
3. **Default Seller:** Uses default ID if not specified
4. **Image Path:** Always starts with `/uploads/products/`
5. **CORS:** Enabled for all origins in development

---

## Quick Test

```bash
# 1. Create product
curl -X POST http://localhost:3003/products \
  -F "name=Test Product" \
  -F "price=99.99" \
  -F "image=@test.png"

# 2. Get all products
curl http://localhost:3003/products

# 3. Get product by ID
curl http://localhost:3003/products/{product-id}

# 4. Update product
curl -X PUT http://localhost:3003/products/{product-id} \
  -F "price=149.99"

# 5. Delete product
curl -X DELETE http://localhost:3003/products/{product-id}
```

---

For detailed documentation, see: `PRODUCTS_API_DOCUMENTATION.txt`

