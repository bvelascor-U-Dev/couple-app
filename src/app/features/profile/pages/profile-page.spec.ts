import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileService } from '../services/profile.service';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  const getProfile = vi.fn();
  const updateProfile = vi.fn();

  const profileServiceMock = {
    getProfile,
    updateProfile,
  };

  const profile = {
    id: 'user-1',
    displayName: 'Sofia Example',
    createdAt: '2026-10-20T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z',
  };

  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(async () => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue(profile);

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        {
          provide: ProfileService,
          useValue: profileServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
  });

  async function loadProfile(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should load the profile and populate the form', async () => {
    await loadProfile();

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(component.profileForm.getRawValue()).toEqual({
      displayName: 'Sofia Example',
    });
    expect(component.isLoading()).toBe(false);
    expect(component.loadErrorMessage()).toBeNull();
  });

  it('should not submit an invalid display name', async () => {
    component.profileForm.setValue({ displayName: 'Ana' });

    await component.onSubmit();

    expect(component.profileForm.controls.displayName.touched).toBe(true);
    expect(component.profileForm.controls.displayName.hasError('pattern')).toBe(true);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('should update the profile and show a success message', async () => {
    await loadProfile();

    const updatedProfile = {
      ...profile,
      displayName: 'Sofia Velasco',
      updatedAt: '2026-10-20T12:30:00.000Z',
    };
    updateProfile.mockResolvedValue(updatedProfile);
    component.profileForm.setValue({ displayName: 'Sofia Velasco' });

    await component.onSubmit();

    expect(updateProfile).toHaveBeenCalledWith({
      displayName: 'Sofia Velasco',
    });
    expect(component.profileForm.getRawValue()).toEqual({
      displayName: 'Sofia Velasco',
    });
    expect(component.successMessage()).toBe('Tu perfil se actualizó correctamente.');
    expect(component.saveErrorMessage()).toBeNull();
    expect(component.isSaving()).toBe(false);
  });
});
