import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Renderer2,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ProductsService } from './products.service';
import { CellClickEvent, GridComponent } from '@progress/kendo-angular-grid';
import { Subscription } from 'rxjs';
import { requiredValidatorLogic } from './required.directive';

const createFormGroup = (dataItem) =>
  new FormGroup({
    RowID: new FormControl(dataItem.RowID),
    Discontinued: new FormControl(dataItem.Discontinued),
    ProductID: new FormControl(dataItem.ProductID, requiredValidatorLogic),
    UnitPrice: new FormControl(dataItem.UnitPrice),
    UnitsInStock: new FormControl(
      dataItem.UnitsInStock,
      Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]{1,3}'),
      ])
    ),
  });

const matches = (el, selector) =>
  (el.matches || el.msMatchesSelector).call(el, selector);

@Component({
  selector: 'my-app',
  template: `
        <kendo-grid
            [data]="view"
            id="productsGrid"
            (cellClick)="cellClickHandler($event)"
            (add)="addHandler()"
        >
            <ng-template kendoGridToolbarTemplate>
                <button kendoGridAddCommand *ngIf="!formGroup">Add new</button>
                <div *ngIf="formGroup">
                    <button kendoButton [disabled]="!formGroup.valid" (click)="saveRow()">Save</button>
                    <button kendoButton themeColor="primary" (click)="cancelHandler()">Cancel</button>
                </div>
            </ng-template>
            <kendo-grid-column field="ProductID" title="Product Name">
            <ng-template kendoGridEditTemplate  let-formGroup="formGroup"> 
                <kendo-dropdownlist #dropdown 
                [formControl]="formGroup.get('ProductID')" 
                (selectionChange)="selectionChange($event)"
                [data]="List"
                textField="ProductName"
                [defaultItem]="{ ProductName: '--select--', ProductID: null }"
                valueField="ProductID" 
                [isRequired]="true"
                [valuePrimitive]="true"
                >
                </kendo-dropdownlist>
            </ng-template>
            </kendo-grid-column>
            <kendo-grid-column field="ProductID"  title="Product ID"></kendo-grid-column>
            <kendo-grid-column field="UnitPrice" editor="numeric" title="Price"></kendo-grid-column>
            <kendo-grid-column field="Discontinued" editor="boolean" title="Discontinued"></kendo-grid-column>
            <kendo-grid-column field="UnitsInStock" editor="numeric" title="Units In Stock"></kendo-grid-column>
        </kendo-grid>
        <div class="example-config">Selected Value:</div>
    `,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(GridComponent)
  private grid: GridComponent;
  public List: { ProductID: string; ProductName: string }[] = [
    {
      ProductID: '1',
      ProductName: 'Test 1',
    },
    {
      ProductID: '2',
      ProductName: 'Test 2',
    },
  ];
  public view: unknown[];

  public formGroup: FormGroup;

  private editedRowIndex: number;
  private docClickSubscription: Subscription = new Subscription();
  private isNew: boolean;

  constructor(private service: ProductsService, private renderer: Renderer2) {}

  public ngOnInit(): void {
    this.view = this.service.products();

    this.docClickSubscription.add(
      this.renderer.listen('document', 'click', this.onDocumentClick.bind(this))
    );
  }

  public selectionChange($event): void {
    debugger;
    this.formGroup.patchValue({
      ProductID: $event.ProductID,
    });
  }

  public writeValues(): string {
    return JSON.stringify(this.formGroup.getRawValue());
  }

  public ngOnDestroy(): void {
    this.docClickSubscription.unsubscribe();
  }

  public addHandler(): void {
    this.closeEditor();

    this.formGroup = createFormGroup({
      RowID: 0,
      ProductID: '',
      Discontinued: false,
      UnitPrice: 0,
      UnitsInStock: '',
    });
    this.isNew = true;

    this.grid.addRow(this.formGroup);
  }

  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      this.saveCurrent();
    }
  }

  public cellClickHandler({
    isEdited,
    dataItem,
    rowIndex,
  }: CellClickEvent): void {
    if (isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    if (this.isNew) {
      rowIndex += 1;
    }

    this.saveCurrent();

    this.formGroup = createFormGroup(dataItem);
    this.editedRowIndex = rowIndex;

    this.grid.editRow(rowIndex, this.formGroup);
  }

  public cancelHandler(): void {
    this.closeEditor();
  }

  private closeEditor(): void {
    this.grid.closeRow(this.editedRowIndex);

    this.isNew = false;
    this.editedRowIndex = undefined;
    this.formGroup = undefined;
  }

  private onDocumentClick(e: Event): void {
    if (
      this.formGroup &&
      this.formGroup.valid &&
      !matches(
        e.target,
        '#productsGrid tbody *, #productsGrid .k-grid-toolbar .k-button'
      )
    ) {
      this.saveCurrent();
    }
  }

  private saveCurrent(): void {
    debugger;
    if (this.formGroup) {
      this.service.save(this.formGroup.value, this.isNew);
      this.closeEditor();
    }
  }
}
