import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from '../../dto/cart.dto';

/**
 * Extracts the customer ID from the Authorization header (Bearer JWT).
 * Decodes the payload WITHOUT verifying the signature — verification is done
 * by the gateway / auth-service upstream.
 *
 * In development (NODE_ENV !== 'production') falls back to a shared mock
 * customer ID so the cart works even without a real login.
 */
const MOCK_CUSTOMER_ID = 'mock-customer-dev';

function extractCustomerId(authHeader: string | undefined): string {
  if (!authHeader?.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') return MOCK_CUSTOMER_ID;
    throw new UnauthorizedException('Missing or invalid Authorization header');
  }
  try {
    const [, payload] = authHeader.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    );
    const id: string = decoded.sub;
    if (!id) throw new Error('no sub');
    return id;
  } catch {
    if (process.env.NODE_ENV !== 'production') return MOCK_CUSTOMER_ID;
    throw new UnauthorizedException('Invalid token');
  }
}

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved' })
  getCart(@Headers('authorization') auth: string) {
    const customerId = extractCustomerId(auth);
    return this.cartService.getCart(customerId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart (or increase quantity)' })
  @ApiResponse({ status: 200, description: 'Item added / quantity increased' })
  addItem(
    @Headers('authorization') auth: string,
    @Body() dto: AddToCartDto,
  ) {
    const customerId = extractCustomerId(auth);
    return this.cartService.addItem(customerId, dto);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: 'Set exact quantity for a cart item (0 = remove)' })
  updateItem(
    @Headers('authorization') auth: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const customerId = extractCustomerId(auth);
    return this.cartService.updateItem(customerId, productId, dto);
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific item from cart' })
  removeItem(
    @Headers('authorization') auth: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const customerId = extractCustomerId(auth);
    return this.cartService.removeItem(customerId, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the entire cart' })
  clearCart(@Headers('authorization') auth: string) {
    const customerId = extractCustomerId(auth);
    return this.cartService.clearCart(customerId);
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Get checkout payload (ready for RabbitMQ / Orders service)',
    description:
      'Returns the cart serialised as an order payload. Does NOT clear the cart.',
  })
  checkoutPayload(@Headers('authorization') auth: string) {
    const customerId = extractCustomerId(auth);
    return this.cartService.checkoutPayload(customerId);
  }
}

