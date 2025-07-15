import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCreditCard,
  FaExchangeAlt,
  FaUserCircle,
  FaCog,
  FaLayerGroup,
  FaUsers,
  FaMoneyBillAlt,
} from "react-icons/fa";

const BottomNavBar = () => {
  const navigate = useNavigate();

  const isBillFeatureEnabled = JSON.parse(
    localStorage.getItem("billFeatureEnabled") || "false"
  );
  console.log("Bill feature enabled:", isBillFeatureEnabled);

  const navItems = [
    { label: "Home", icon: <FaHome />, path: "/home" },
    { label: "Cards", icon: <FaCreditCard />, path: "/manage-cards" },
    { label: "Transactions", icon: <FaExchangeAlt />, path: "/transactions" },
    ...(isBillFeatureEnabled
      ? [{ label: "Bill Pay", icon: <FaMoneyBillAlt />, path: "/bill-pay" }]
      : []),

    { label: "pool", icon: <FaUsers />, path: "/card-pool" },
    { label: "Account", icon: <FaUserCircle />, path: "/profile" },
    // { label: 'Settings', icon: <FaCog />, path: '/settings', hidden : true}
  ]; //hide settings

  return (
    <div className="fixed bottom-0 left-0 w-full border-t border-[#283139] bg-[#1b2127] flex justify-around py-2 z-50">
      {navItems
        .filter((item) => !item.hidden)
        .map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-[#9cabba] hover:text-white active:scale-95 transition duration-150 ease-in-out cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <div className="text-xl">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
    </div>
  );
};

export default BottomNavBar;
