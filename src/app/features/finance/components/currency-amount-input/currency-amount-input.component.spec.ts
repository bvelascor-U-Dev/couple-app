import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencyAmountInputComponent } from './currency-amount-input.component';

describe('CurrencyAmountInputComponent', () => {
  let component: CurrencyAmountInputComponent;
  let fixture: ComponentFixture<CurrencyAmountInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyAmountInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyAmountInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should format a valid model value and clear invalid values', () => {
    component.writeValue(4000000);

    expect(component.displayValue()).toBe('4.000.000');
    expect(component.currencySymbol()).toBe('$');

    component.writeValue(null);

    expect(component.displayValue()).toBe('');
  });

  it('should keep only digits, format the visual value, and notify Angular with the number', () => {
    const onChange = vi.fn();
    const inputElement = document.createElement('input');

    component.registerOnChange(onChange);
    inputElement.value = '00e25.000';
    component.onInput({ target: inputElement } as unknown as Event);

    expect(inputElement.value).toBe('25.000');
    expect(component.displayValue()).toBe('25.000');
    expect(onChange).toHaveBeenCalledWith(25000);
  });

  it('should notify Angular when it is touched and reflect the disabled state', () => {
    const onTouched = vi.fn();

    component.registerOnTouched(onTouched);
    component.setDisabledState(true);
    component.onBlur();

    expect(component.isDisabled()).toBe(true);
    expect(onTouched).toHaveBeenCalledTimes(1);
  });
});
