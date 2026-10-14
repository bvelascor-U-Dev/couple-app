import { TestBed } from '@angular/core/testing';
import { provideSupabase, SUPABASE_CLIENT } from './supabase.provider';

describe('supabase provider', () => {
  it('should create and reuse a Supabase client', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSupabase({
          url: 'https://example.supabase.co',
          publishableKey: 'sb_publishable_test_key',
        }),
      ],
    });

    const firstClient = TestBed.inject(SUPABASE_CLIENT);
    const secondClient = TestBed.inject(SUPABASE_CLIENT);

    expect(firstClient).toBeTruthy();
    expect(firstClient).toBe(secondClient);
  });
  it('should reject an empty configuration', () => {
    expect(() =>
      provideSupabase({
        url: '   ',
        publishableKey: '',
      }),
    ).toThrow('Supabase configuration is missing.');
  });
});
