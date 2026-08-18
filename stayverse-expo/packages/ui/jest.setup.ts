jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native").View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    ScrollView: require("react-native").ScrollView,
    Switch: require("react-native").Switch,
    TextInput: require("react-native").TextInput,
    DrawerLayoutAndroid: View,
    FlatList: require("react-native").FlatList,
    gestureHandlerRootHOC: (c) => c,
    Directions: {},
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  const BottomSheet = React.forwardRef(({ children, ...rest }, _ref) =>
    React.createElement(View, { testID: "mock-bottom-sheet", ...rest }, children),
  );
  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: View,
    BottomSheetBackdrop: () => null,
  };
});

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props) =>
      React.createElement(View, { testID: "mock-lottie", ...props }),
  };
});

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

jest.mock("@stayverse/assets/lottie/empty.json", () => ({}), { virtual: true });
jest.mock("@stayverse/assets/lottie/apartment-empty.json", () => ({}), {
  virtual: true,
});
jest.mock("@stayverse/assets/lottie/chefs-empty.json", () => ({}), {
  virtual: true,
});
jest.mock("@stayverse/assets/lottie/rides-empty.json", () => ({}), {
  virtual: true,
});
