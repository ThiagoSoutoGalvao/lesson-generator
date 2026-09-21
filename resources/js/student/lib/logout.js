// Laravel's /logout is a POST guarded by the CSRF token, so a plain link can't do it.
export function logout() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    const t = document.createElement('input');
    t.type = 'hidden';
    t.name = '_token';
    t.value = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
    form.appendChild(t);
    document.body.appendChild(form);
    form.submit();
}
