import React, { createContext, useRef, useEffect, useContext } from "react";
import {
  Form,
  Switch,
  Table,
  GetRef,
  Input,
  InputRef,
  Tag,
  Button,
  Flex,
  Divider,
  Card,
  Popover,
  TableProps,
  Select,
} from "antd";
import { NewRule } from "./NewRule";
import { useRules } from "@/store/ruleStore";
import { ApiRuleItem } from "@/types";
import { Editor } from "json5-editor";
import JSON5 from "json5";

type FormInstance<T> = GetRef<typeof Form<T>>;

interface EditableRowProps {
  index: number;
}

type ColumnTypes = Exclude<TableProps<ApiRuleItem>["columns"], undefined>;

const TableRowContext = createContext<FormInstance<any> | null>(null);
const useRowForm = () => useContext(TableRowContext);

const TableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <TableRowContext.Provider value={form}>
        <tr {...props} />
      </TableRowContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof ApiRuleItem;
  record: ApiRuleItem;
  handleSave: (record: ApiRuleItem) => void;
}

const TableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const form = useRowForm();
  const inputRef = useRef<InputRef>(null);
  const [editing, setEditing] = React.useState(false);
  useEffect(() => {
    if (editing) {
      inputRef?.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form?.setFieldValue(dataIndex, record[dataIndex]);
  };
  const save = async () => {
    const values = await form?.validateFields();
    toggleEdit();
    handleSave(Object.assign({}, record, values));
  };
  return (
    <td {...restProps}>
      {editable ? (
        editing ? (
          <Form.Item name={dataIndex} rules={[{ required: true, message: "必填" }]}>
            <Input ref={inputRef} onBlur={save} onPressEnter={save} />
          </Form.Item>
        ) : (
          <div className="cursor-pointer" onClick={toggleEdit}>
            {children}
          </div>
        )
      ) : (
        children
      )}
    </td>
  );
};

export function ApiTable() {
  const [rules, { removeRules, updateRules, addRules }] = useRules();
  let timer = useRef<any>(null);
  const defaultColumns: Array<ColumnTypes[number] & { editable?: boolean; dataIndex?: string }> = [
    { dataIndex: "path", title: "路径", width: 200, editable: true, align: "left" },
    {
      dataIndex: "method",
      title: "方法",
      width: 80,
      align: "center",
      render: (method: "GET" | "POST", record: ApiRuleItem) => {
        return (
          <Popover
            trigger={"click"}
            content={
              <>
                <Select
                  defaultValue={method}
                  onChange={(value) => {
                    updateRules({ ...record, method: value });
                  }}
                >
                  <Select.Option value="GET">GET</Select.Option>
                  <Select.Option value="POST">POST</Select.Option>
                </Select>
              </>
            }
          >
            <Tag color={method === "GET" ? "green" : "red"} className="cursor-pointer">
              {method}
            </Tag>
          </Popover>
        );
      },
    },
    {
      dataIndex: "mock",
      title: "数据",
      width: 100,
      align: "center",
      className: "cursor-pointer",
      render: (mock: string, record: ApiRuleItem) => {
        return (
          <div className="w-fit mx-auto">
            <Popover
              trigger={"click"}
              title="Mock"
              content={
                <>
                  <Card className="w-[500px] h-[500px] overflow-y-auto relative">
                    <Editor
                      initialValue={mock}
                      onChange={(value) => {
                        timer.current && clearTimeout(timer.current);
                        timer.current = setTimeout(() => {
                          try {
                            updateRules({ ...record, mock: JSON.stringify(JSON5.parse(value)) });
                          } catch (error) {}
                        }, 5000);
                      }}
                    />
                  </Card>
                </>
              }
            >
              <Button type="link">编辑</Button>
            </Popover>
          </div>
        );
      },
    },
    {
      dataIndex: "enabled",
      title: "启用",
      width: 100,
      align: "center",
      render: (enabled: boolean, record: ApiRuleItem) => {
        return (
          <TableRowContext.Consumer>
            {(form) => {
              return (
                <Switch
                  defaultChecked={enabled}
                  onChange={(value) => {
                    form!.setFieldValue("enabled", value);
                    updateRules({ ...record, enabled: value });
                  }}
                />
              );
            }}
          </TableRowContext.Consumer>
        );
      },
    },
    {
      title: "操作",
      key: "operation",
      width: 100,
      align: "right",
      render: (_: any, record: ApiRuleItem) => (
        <Button className="mr-auto" type="link" danger onClick={() => removeRules(record.id)}>
          删除
        </Button>
      ),
    },
  ];
  const columns = defaultColumns.map((col) => {
    return {
      ...col,
      onCell: (record: ApiRuleItem) => {
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: updateRules,
        };
      },
    };
  });
  return (
    <>
      <Card>
        <Flex gap="small">
          <NewRule onOk={addRules} />
          <Button type="primary">cURL</Button>
        </Flex>
        <Divider />
        <Table<ApiRuleItem>
          bordered={false}
          rowKey="id"
          columns={columns as ColumnTypes}
          dataSource={rules}
          pagination={false}
          components={{
            body: {
              row: TableRow,
              cell: TableCell,
            },
          }}
        />
      </Card>
    </>
  );
}
