import "@ant-design/v5-patch-for-react-19";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, App as AntdApp } from "antd";
import RootLaout from "./components/RootLayout";
import { ApiTable } from "./components/ApiTable";

function App() {
  return (
    <>
      <StyleProvider>
        <ConfigProvider>
          <AntdApp>
            <RootLaout>
              <ApiTable />
            </RootLaout>
          </AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </>
  );
}

export default App;
