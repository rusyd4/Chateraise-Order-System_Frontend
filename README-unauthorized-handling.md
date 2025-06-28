# Unauthorized Error Handling

Fitur ini menangani error 401 (Unauthorized) secara otomatis dengan menampilkan modal yang memberikan opsi untuk kembali ke halaman login.

## Fitur

- ✅ **Modal Unauthorized**: Muncul otomatis ketika terjadi error 401
- ✅ **Pesan Error yang Informatif**: Menampilkan pesan yang jelas dalam bahasa Indonesia  
- ✅ **Tombol Login**: Redirect langsung ke halaman login dengan membersihkan session
- ✅ **Integrasi Global**: Bekerja di seluruh aplikasi tanpa konfigurasi tambahan
- ✅ **Type-Safe**: Menggunakan TypeScript dengan error types yang proper

## Komponen yang Dibuat

### 1. `UnauthorizedModal` (`components/ui/unauthorized-modal.tsx`)
Modal yang menampilkan pesan error dan tombol untuk kembali ke login.

```tsx
<UnauthorizedModal
  isOpen={true}
  message="Sesi Anda telah berakhir. Silakan login kembali."
  onClose={() => {}}
/>
```

### 2. `AuthProvider` (`lib/auth-provider.tsx`)
Provider yang menangani state modal unauthorized secara global.

```tsx
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // ... handles global unauthorized modal state
}
```

### 3. `ApiError` Class (`lib/api-errors.ts`)
Class untuk error handling yang lebih terstruktur.

```tsx
export class ApiError extends Error {
  public isUnauthorized(): boolean
  public isForbidden(): boolean
  public isServerError(): boolean
  public isClientError(): boolean
}
```

### 4. Enhanced `apiFetch` (`lib/api.ts`)
API client yang sudah dimodifikasi untuk menangani error 401 secara otomatis.

## Cara Kerja

1. **Request API Gagal dengan 401**: Ketika request ke backend mengembalikan status 401
2. **Error Parsing**: API client mengparse error dan membuat instance `ApiError`
3. **Check Unauthorized**: Sistem mendeteksi bahwa ini adalah error 401
4. **Show Modal**: Modal unauthorized ditampilkan secara otomatis
5. **User Action**: User dapat memilih untuk ke halaman login atau menutup modal
6. **Clear Session**: Token dan data session dibersihkan sebelum redirect

## Setup

Fitur ini sudah terintegrasi di `app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Penggunaan

### Penggunaan Normal
Tidak perlu konfigurasi tambahan. Setiap kali menggunakan `apiFetch`, error 401 akan ditangani otomatis:

```tsx
// Tidak perlu perubahan kode
try {
  const data = await apiFetch("/admin/branches");
  setBranches(data);
} catch (error) {
  // Error 401 sudah ditangani otomatis dengan modal
  console.error("Other errors:", error);
}
```

### Manual Usage (Opsional)
Untuk kasus khusus, Anda bisa menggunakan hook `useAuth`:

```tsx
import { useAuth } from "@/lib/auth-provider";

function MyComponent() {
  const { showUnauthorizedModal } = useAuth();
  
  const handleManualUnauthorized = () => {
    showUnauthorizedModal("Custom unauthorized message");
  };
}
```

## Testing

Untuk menguji fitur ini, gunakan komponen `UnauthorizedTest`:

```tsx
import UnauthorizedTest from "@/components/test/unauthorized-test";

// Dalam komponen admin atau branch
<UnauthorizedTest />
```

### Contoh Integrasi di Admin Dashboard

Tambahkan di halaman admin untuk testing:

```tsx
// app/admin/dashboard/page.tsx
import UnauthorizedTest from "@/components/test/unauthorized-test";

export default function AdminDashboard() {
  return (
    <div>
      {/* Existing dashboard content */}
      
      {/* Development testing - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Development Testing</h3>
          <UnauthorizedTest />
        </div>
      )}
    </div>
  );
}
```

## Error Types yang Ditangani

- **401 Unauthorized**: No token atau token tidak valid
- **403 Forbidden**: Token valid tapi tidak memiliki akses ke resource

## Customization

### Custom Error Message
```tsx
// Dalam apiFetch, pesan akan diparse dari response server
// Atau bisa menggunakan default message yang sudah disiapkan
```

### Custom Modal Styling
Edit `components/ui/unauthorized-modal.tsx` untuk mengubah tampilan modal.

### Custom Redirect Behavior
Edit `handleLoginRedirect` dalam `UnauthorizedModal` untuk custom behavior.

## Backward Compatibility

Fitur ini tidak mengubah API existing. Semua kode yang sudah ada akan tetap bekerja dengan tambahan handling untuk error 401.

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers
- ✅ Support untuk localStorage

## Security Benefits

1. **Automatic Session Cleanup**: Token dihapus secara otomatis saat expired
2. **Clear User Feedback**: User tahu kapan session berakhir
3. **Prevent Unauthorized Access**: Redirect otomatis ke login mencegah akses tidak sah
4. **No Token Leakage**: Token invalid tidak tersimpan di localStorage 