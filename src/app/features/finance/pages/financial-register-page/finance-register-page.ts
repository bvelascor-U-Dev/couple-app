import { Component } from '@angular/core';
import { FinancialTransactionFormComponent } from '../../components/financial-transaction-form/financial-transaction-form.component';

@Component({
  selector: 'app-finance-page',
  imports: [FinancialTransactionFormComponent],
  templateUrl: './finance-register-page.html',
})
export class FinanceRegisterPage {}
