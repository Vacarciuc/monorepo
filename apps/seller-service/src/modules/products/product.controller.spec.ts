import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductResponseDto } from '../../dto/product-response.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const createdAt = new Date('2026-01-01T10:00:00.000Z');
  const updatedAt = new Date('2026-01-01T10:00:00.000Z');

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    quantity: 10,
    imagePath: '/uploads/products/test.png',
    sellerId: '00000000-0000-0000-0000-000000000001',
    createdAt,
    updatedAt,
  };

  const mockProductResponse = ProductResponseDto.fromEntity(mockProduct as any);

  const mockProductService = {
    createProduct: jest.fn(),
    findAllProducts: jest.fn(),
    findProductById: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product with image', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
      };

      const mockFile = {
        filename: 'test.png',
      } as Express.Multer.File;

      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const result = await controller.createProduct(createDto, mockFile);

      expect(service.createProduct).toHaveBeenCalledWith(
        createDto,
        '/uploads/products/test.png',
      );
      expect(result).toEqual(mockProductResponse);
    });

    it('should create a product without image', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
      };

      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const result = await controller.createProduct(createDto);

      expect(service.createProduct).toHaveBeenCalledWith(createDto, undefined);
      expect(result).toEqual(mockProductResponse);
    });

    it('should include quantity in the response', async () => {
      const createDto = { name: 'Test Product', price: 99.99, quantity: 10 };
      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const result = await controller.createProduct(createDto);

      expect(result.quantity).toBe(10);
    });
  });

  describe('getAllProducts', () => {
    it('should return an array of ProductResponseDto', async () => {
      const products = [mockProduct];
      mockProductService.findAllProducts.mockResolvedValue(products);

      const result = await controller.getAllProducts();

      expect(service.findAllProducts).toHaveBeenCalled();
      expect(result).toEqual([mockProductResponse]);
    });

    it('should return empty array when no products exist', async () => {
      mockProductService.findAllProducts.mockResolvedValue([]);

      const result = await controller.getAllProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductById', () => {
    it('should return a ProductResponseDto', async () => {
      mockProductService.findProductById.mockResolvedValue(mockProduct);

      const result = await controller.getProductById(mockProduct.id);

      expect(service.findProductById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProductResponse);
    });

    it('should include quantity in single product response', async () => {
      mockProductService.findProductById.mockResolvedValue(mockProduct);

      const result = await controller.getProductById(mockProduct.id);

      expect(result.quantity).toBe(10);
    });
  });

  describe('updateProduct', () => {
    it('should update a product with new image and return ProductResponseDto', async () => {
      const updateDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      const mockFile = {
        filename: 'updated.png',
      } as Express.Multer.File;

      const updatedMock = { ...mockProduct, ...updateDto };
      mockProductService.updateProduct.mockResolvedValue(updatedMock);

      const result = await controller.updateProduct(mockProduct.id, updateDto, mockFile);

      expect(service.updateProduct).toHaveBeenCalledWith(
        mockProduct.id,
        updateDto,
        '/uploads/products/updated.png',
      );
      expect(result.name).toEqual(updateDto.name);
      expect(result.price).toEqual(149.99);
    });

    it('should update a product without new image', async () => {
      const updateDto = { quantity: 50 };
      mockProductService.updateProduct.mockResolvedValue({ ...mockProduct, quantity: 50 });

      const result = await controller.updateProduct(mockProduct.id, updateDto);

      expect(service.updateProduct).toHaveBeenCalledWith(mockProduct.id, updateDto, undefined);
      expect(result.quantity).toBe(50);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockProductService.deleteProduct.mockResolvedValue(undefined);

      await controller.deleteProduct(mockProduct.id);

      expect(service.deleteProduct).toHaveBeenCalledWith(mockProduct.id);
    });
  });
});

