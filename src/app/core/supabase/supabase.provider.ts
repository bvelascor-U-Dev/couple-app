import { InjectionToken, Provider } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
    url: string;
    publishableKey: string;
}

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>(
    'SUPABASE_CLIENT',
);

export function provideSupabase(config: SupabaseConfig): Provider {
    if(!config.url.trim() || !config.publishableKey.trim()){
        throw new Error(
            'Supabase configuration is missing.',
        );  
    };
    return {
        provide: SUPABASE_CLIENT,
        useFactory: () => createClient(config.url, config.publishableKey),
    };
}
