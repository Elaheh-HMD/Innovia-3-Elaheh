export function isAdmin(): boolean {
    const token = localStorage.getItem("token");

    if (!token) return false;

    try {
        const payload = token.split(".")[1];
        if (!payload) return false;

        const normalized = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const claims = JSON.parse(
            atob(normalized.padEnd(
                Math.ceil(normalized.length / 4) * 4,
                "="
            ))
        );

        const role =
            claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
            ?? claims.role
            ?? claims.roles;

        return Array.isArray(role)
            ? role.includes("Admin")
            : role === "Admin";
    } catch {
        return false;
    }
}
