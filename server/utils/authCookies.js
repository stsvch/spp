export function setRefreshCookie(res, token) {
  res.cookie("refresh", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refresh", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}
