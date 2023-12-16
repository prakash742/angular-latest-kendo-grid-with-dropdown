import { Injectable } from '@angular/core';
import { Product } from './model';
import { products } from './products';

@Injectable()
export class ProductsService {
  private data: unknown[] = products;
  private counter: number = products.length;

  public products(): unknown[] {
    return this.data;
  }

  public remove(product: Product): void {
    const index = this.data.findIndex(
      ({ ProductID }) => ProductID === product.RowID
    );
    this.data.splice(index, 1);
  }

  public save(product: Product, isNew: boolean): void {
      debugger
    if (isNew) {
      product.RowID = this.counter++;
      this.data.splice(0, 0, product);
    } else {
      Object.assign(
        this.data.find(({ RowID }) => RowID === product.RowID),
        product
      );
    }
  }
}
