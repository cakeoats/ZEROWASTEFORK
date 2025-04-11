import React from 'react';
import { Navbar, Button, Dropdown } from 'flowbite-react';
import { HiUser, HiOutlineLogin, HiOutlineLogout, HiShoppingCart } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext'; // Sesuaikan path jika perlu

function NavbarComponent() {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const { user, logout } = useAuth(); // ← pakai context

    return (
        <div className="w-full bg-gray-800">
            <div className="container mx-auto">
                <Navbar fluid className="py-4 px-4 bg-gray-800 border-none">
                    <Navbar.Brand href="/">
                        <span className="self-center whitespace-nowrap text-xl font-bold text-white">
                            ZeroWasteMarket
                        </span>
                    </Navbar.Brand>

                    {/* Search/User */}
                    <div className="flex md:order-2">
                        <Dropdown
                            arrowIcon={false}
                            inline
                            label={
                                <Button
                                    color="gray"
                                    pill
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <HiUser className="h-5 w-5" />
                                </Button>
                            }
                            className="bg-gray-700 border border-gray-600"
                        >
                            {user ? (
                                <>
                                    <Dropdown.Item
                                        className="text-white hover:bg-gray-600"
                                        onClick={() => window.location.href = '/profile'}
                                    >
                                        {user.username}
                                    </Dropdown.Item>
                                    <Dropdown.Item icon={HiShoppingCart} className="text-white hover:bg-gray-600">
                                        Cart
                                    </Dropdown.Item>
                                    <Dropdown.Divider className="bg-gray-600" />
                                    <Dropdown.Item
                                        icon={HiOutlineLogout}
                                        className="text-white hover:bg-gray-600"
                                        onClick={logout}
                                    >
                                        Logout
                                    </Dropdown.Item>
                                </>
                            ) : (
                                <Dropdown.Item
                                    icon={HiOutlineLogin}
                                    className="text-white hover:bg-gray-600"
                                    onClick={() => window.location.href = '/login'}
                                >
                                    Login
                                </Dropdown.Item>
                            )}
                        </Dropdown>
                    </div>

                    <Navbar.Collapse>
                        <Navbar.Link href="#" className="text-gray-300 hover:text-white">Luxury</Navbar.Link>
                        <Navbar.Link href="#" className="text-gray-300 hover:text-white">Fashion</Navbar.Link>
                        <Navbar.Link href="#" className="text-gray-300 hover:text-white">Electronics</Navbar.Link>
                        <Navbar.Link href="#" className="text-gray-300 hover:text-white">Property</Navbar.Link>
                        <Navbar.Link href="#" className="text-gray-300 hover:text-white">Cars</Navbar.Link>
                    </Navbar.Collapse>
                </Navbar>
            </div>
        </div>
    );
}

export default NavbarComponent;
