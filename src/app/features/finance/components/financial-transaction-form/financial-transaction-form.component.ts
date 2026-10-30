import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';
import { FinancialCategory } from '../../models/financial-category.model';
import { FinancialSubcategory } from '../../models/financial-subcategory.model';
import { TransactionType,ExpenseScope } from '../../models/financial-transaction.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialTransactionInput } from '../../models/financial-transaction.input';

@Component({
  selector: 'app-financial-transaction-form',
  imports: [ReactiveFormsModule],
  templateUrl: './financial-transaction-form.html',
})
export class FinancialTransactionFormComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly destroyRef = inject(DestroyRef);
  
  public readonly categories = signal<FinancialCategory[]>([]);
  public readonly subcategories = signal<FinancialSubcategory[]>([]);

  public readonly isLoadingCategories = signal(true);
  public readonly isLoadingSubcategories = signal(false);
  public readonly isSaving = signal(false);

  public readonly loadErrorMessage = signal<string | null>(null);
  public readonly subcategoryErrorMessage = signal<string | null>(null);
  public readonly saveErrorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
    
  readonly transactionForm = new FormGroup ({
    transactionType: new FormControl<TransactionType> ('expense',{
      nonNullable: true,
      validators: [Validators.required]
    }),
    categoryId: new FormControl ('',{
      nonNullable: true,
      validators: [Validators.required]
    }),
    subcategoryId: new FormControl <string | null> (null),
    amount: new FormControl<number | null> (null,{
      validators: [Validators.required,Validators.min(0.01)],
    }),
    effectiveDate: new FormControl(this.getCurrentLocalDate(),{
      nonNullable: true,
      validators: [Validators.required]
    }),
    concept: new FormControl<string>('',{
      nonNullable: true
    }),
    expenseScope: new FormControl <ExpenseScope>('personal',{
      nonNullable: true
    }),
    isSmallExpense: new FormControl<boolean>(false,{
      nonNullable: true
    })
  });

  public ngOnInit(): void{

    this.transactionForm.controls.transactionType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((transactionType)=>{
        this.transactionForm.controls.categoryId.reset();
        this.categories.set([]);
        void this.loadCategories(transactionType)
      });

    this.transactionForm.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categoryId)=> {
        this.transactionForm.controls.subcategoryId.reset();
        if(!categoryId){
          this.subcategories.set([]);
          this.subcategoryErrorMessage.set(null);
          return;
        }
        void this.loadSubcategories(categoryId)
      });

    void this.loadCategories(this.transactionForm.controls.transactionType.value);

  }

  private async loadCategories(transactionType: TransactionType): Promise<void>{
      this.isLoadingCategories.set(true);
      
      this.loadErrorMessage.set(null);
      try{
        const categories: FinancialCategory[] = await this.financialService.getCategories(transactionType);
        this.categories.set(categories);
      } catch {
        this.loadErrorMessage.set('No fue posible cargar las categorías. Recarga la página e inténtalo nuevamente.')
        this.categories.set([]);
      } finally{
        this.isLoadingCategories.set(false);
      } 
  };

  public async onSave(addAnother: boolean): Promise<void> {
    if(this.transactionForm.invalid){
      this.transactionForm.markAllAsTouched();
      return;
    }
    if(this.isSaving()){
      return;
    }

    this.saveErrorMessage.set(null);
    this.successMessage.set(null);

    const {transactionType, categoryId, subcategoryId, amount, effectiveDate, concept, expenseScope, isSmallExpense} = this.transactionForm.getRawValue();

    if(amount ===  null){
      return;
    }

    this.isSaving.set(true);

    const input: FinancialTransactionInput = {
      transactionType: transactionType,
      categoryId: categoryId,
      subcategoryId: subcategoryId,
      amount: amount,
      effectiveDate: effectiveDate,
      concept: concept.trim() || null,
      expenseScope: transactionType === 'expense' ? expenseScope: null,
      isSmallExpense: transactionType === 'expense' ? isSmallExpense: false,
    } 

    try{
      await this.financialService.createTransaction(input);
      this.successMessage.set('El movimiento se registró correctamente.');
      this.addAnother();
    } catch {
      this.saveErrorMessage.set('No fue posible guardar el movimiento. Inténtalo nuevamente.')
    } finally {
      this.isSaving.set(false);
    }
  }

  private addAnother() {
    this.transactionForm.controls.categoryId.reset();
    this.transactionForm.controls.subcategoryId.reset();
    this.transactionForm.controls.amount.reset();
    this.transactionForm.controls.concept.reset();
    this.transactionForm.controls.isSmallExpense.reset();
  }

  private async loadSubcategories(categoryId: string): Promise<void>{
    this.isLoadingSubcategories.set(true);

    this.subcategoryErrorMessage.set(null)
    this.subcategories.set([]);

    try{
      const subcategories: FinancialSubcategory[] = await this.financialService.getSubcategories(categoryId);
      this.subcategories.set(subcategories);
    } catch {
      this.subcategoryErrorMessage.set('No fue posible cargar las subcategorías. Aun así, puedes continuar sin seleccionar una.');
      this.subcategories.set([]);
    } finally{
      this.isLoadingSubcategories.set(false);
    }
  };
  
  private getCurrentLocalDate(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

}
