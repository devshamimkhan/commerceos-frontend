const blogReturnKey = 'blogs-list-return';

export function rememberBlogList() {
  try { sessionStorage.setItem(blogReturnKey, 'true'); } catch { /* Browser history still works. */ }
}

export function consumeBlogListReturn() {
  try {
    const shouldReturn = sessionStorage.getItem(blogReturnKey) === 'true';
    sessionStorage.removeItem(blogReturnKey);
    return shouldReturn;
  } catch {
    return false;
  }
}

export function clearBlogListReturn() {
  try { sessionStorage.removeItem(blogReturnKey); } catch { /* Continue navigation. */ }
}
