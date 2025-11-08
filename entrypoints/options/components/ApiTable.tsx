import React, { createContext, useRef, useReducer, useEffect, useContext } from "react";
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
} from "antd";
import { NewRule } from "./NewRule";
import { ApiRuleItem, useRules } from "@/store/ruleStore";
import { sendMessage } from "@/utils/sendMessage";

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
  const [rules, setRules] = useRules();
  const handleSaveUpdate = async (newRule: ApiRuleItem) => {
    await sendMessage({ type: "updateDynamicRules", data: [newRule] });
    setRules((rules) => {
      return rules.map((rule) => {
        if (rule.id === newRule.id) {
          return Object.assign({}, rule, newRule);
        }
        return rule;
      });
    });
  };
  const handleRemove = async (id: number) => {
    await sendMessage({ type: "removeDynamicRules", data: [id] });
    setRules((rules) => rules.filter((rule) => rule.id !== id));
  };
  const handleAdd = async (data: ApiRuleItem) => {
    await sendMessage({ type: "addDynamicRules", data: [data] });
    setRules((rules) => rules.concat(data));
  };
  const defaultColumns: Array<ColumnTypes[number] & { editable?: boolean; dataIndex?: string }> = [
    { dataIndex: "path", title: "路径", width: 200, editable: true, align: "left" },
    {
      dataIndex: "method",
      title: "方法",
      width: 80,
      align: "center",
      render: (method: "GET" | "POST") => <Tag color={method === "GET" ? "green" : "red"}>{method}</Tag>,
    },
    {
      dataIndex: "json",
      title: "数据",
      width: 100,
      align: "center",
      className: "cursor-pointer",
      render: (json: string) => {
        return (
          <div className="w-fit">
            <Popover
              trigger={"click"}
              title=""
              content={
                <pre>
                  <code>{json}</code>
                </pre>
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
                <Form.Item>
                  <Switch
                    defaultChecked={enabled}
                    onChange={(value) => {
                      form!.setFieldValue("enabled", value);
                      handleSaveUpdate({ ...record, enabled: value });
                    }}
                  />
                </Form.Item>
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
        <Button type="link" danger onClick={() => handleRemove(record.id)}>
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
          handleSave: handleSaveUpdate,
        };
      },
    };
  });
  return (
    <>
      <Card>
        <Flex gap="small">
          <NewRule onOk={handleAdd} />
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
