import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    imagePath: '/uploads/products/test.png',
    sellerId: '00000000-0000-0000-0000-000000000001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
      expect(result).toEqual(mockProduct);
    });

    it('should create a product without image', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
      };

      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const result = await controller.createProduct(createDto);

      expect(service.createProduct).toHaveBeenCalledWith(createDto, null);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getAllProducts', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      mockProductService.findAllProducts.mockResolvedValue(products);

      const result = await controller.getAllProducts();

      expect(service.findAllProducts).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe('getProductById', () => {
    it('should return a product', async () => {
      mockProductService.findProductById.mockResolvedValue(mockProduct);

      const result = await controller.getProductById(mockProduct.id);

      expect(service.findProductById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update a product with new image', async () => {
      const updateDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      const mockFile = {
        filename: 'updated.png',
      } as Express.Multer.File;

      mockProductService.updateProduct.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await controller.updateProduct(mockProduct.id, updateDto, mockFile);

      expect(service.updateProduct).toHaveBeenCalledWith(
        mockProduct.id,
        updateDto,
        '/uploads/products/updated.png',
      );
      expect(result.name).toEqual(updateDto.name);
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

