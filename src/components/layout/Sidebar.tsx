
interface NavItem {
    path: string;
    label: string;
    subNavItems?: NavItem[]
}

const NAVIGIATION_ITEMS: NavItem[] = [
    {path: "/", label: "Home"},
    {path: "/blog", label: "Blog", subNavItems: [{path: "/blog/programming", label: "Programming"}]},
];

export default function Sidebar() {
    return (
        <nav className="sidebar">
            
        </nav>
    );
}