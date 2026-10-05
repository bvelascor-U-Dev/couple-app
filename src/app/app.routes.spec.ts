import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {routes} from './app.routes';

describe ('application routes', () => {
    let harness: RouterTestingHarness;
    let router: Router;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [provideRouter(routes)],
        });

        router = TestBed.inject(Router);
        harness = await RouterTestingHarness.create();
    });

    it('redirect the root URL to the sign-in page', async () => {
        await harness.navigateByUrl('/');

        expect(router.url).toBe('/auth/sign-in');
    });
})