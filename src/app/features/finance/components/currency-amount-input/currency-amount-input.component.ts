import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-currency-amount-input',
  imports: [],
  templateUrl: './currency-amount-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyAmountInputComponent),
      multi: true,
    },
  ],
})
export class CurrencyAmountInputComponent implements ControlValueAccessor {
  public readonly inputId = input('currency-amount');
  public readonly currencyCode = input('COP');
  public readonly locale = input('es-CO');
  public readonly placeholder = input('0');

  public readonly displayValue = signal('');
  public readonly isDisabled = signal(false);

  public readonly currencySymbol = computed(() => {
    try {
      const currencyPart = new Intl.NumberFormat(this.locale(), {
        style: 'currency',
        currency: this.currencyCode(),
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((part) => part.type === 'currency');

      return currencyPart?.value ?? this.currencyCode();
    } catch {
      return this.currencyCode();
    }
  });

  private readonly numberFormatter = computed(
    () =>
      new Intl.NumberFormat(this.locale(), {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
  );

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: number | null): void {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      this.displayValue.set('');
      return;
    }

    this.displayValue.set(this.numberFormatter().format(Math.trunc(value)));
  }

  public registerOnChange(onChange: (value: number | null) => void): void {
    this.onChange = onChange;
  }

  public registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  public onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const digits = inputElement.value.replace(/\D/g, '');

    if (!digits) {
      inputElement.value = '';
      this.displayValue.set('');
      this.onChange(null);
      return;
    }

    const normalizedDigits = digits.replace(/^0+(?=\d)/, '');
    const amount = Number(normalizedDigits);
    const formattedAmount = this.numberFormatter().format(amount);

    this.displayValue.set(formattedAmount);
    inputElement.value = formattedAmount;
    this.onChange(amount);
  }

  public onBlur(): void {
    this.onTouched();
  }
}
