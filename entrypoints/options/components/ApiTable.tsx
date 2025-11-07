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
import { ApiItem } from "./interface";

type FormInstance<T> = GetRef<typeof Form<T>>;

interface EditableRowProps {
  index: number;
}

type ColumnTypes = Exclude<TableProps<ApiItem>["columns"], undefined>;

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
  dataIndex: keyof ApiItem;
  record: ApiItem;
  handleSave: (record: ApiItem) => void;
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

type ActionType =
  | { type: "recover"; data: ApiItem[] }
  | { type: "add"; data: Omit<ApiItem, "uuid"> }
  | { type: "remove"; data: { uuid: string } }
  | { type: "update"; data: Partial<ApiItem> & { uuid: string } };
export function ApiTable() {
  const recoverdRef = useRef(-1);
  const [dataSource, dispatch] = useReducer<ApiItem[], [ActionType]>((state, action) => {
    switch (action.type) {
      case "recover":
        return action.data;
      case "add":
        return [...state, { ...action.data, uuid: window.crypto.randomUUID() }];
      case "remove":
        return state.filter((item) => item.uuid !== action.data.uuid);
      case "update":
        return state.map((item) => {
          if (item.uuid === action.data.uuid) {
            return Object.assign({}, item, action.data);
          }
          return item;
        });
      default: {
        return state;
      }
    }
  }, []);
  useEffect(() => {
    recoverdRef.current = -1;
    storage
      .getItem<ApiItem[]>("local:rules")
      .then((data) => {
        if (data) {
          dispatch({ type: "recover", data });
        }
      })
      .finally(() => {
        recoverdRef.current = 0;
      });
  }, []);
  useEffect(() => {
    if (dataSource.length && recoverdRef.current === 1) {
      storage.setItem("local:rules", dataSource);
    }
    if (recoverdRef.current === 0) {
      recoverdRef.current = 1;
    }
  }, [dataSource]);
  const handleSave = (newRecord: Partial<ApiItem>) => {
    dispatch({ type: "update", data: newRecord as ApiItem });
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
      render: (enabled: boolean, record: ApiItem) => {
        return (
          <TableRowContext.Consumer>
            {(form) => {
              return (
                <Switch
                  defaultChecked={enabled}
                  onChange={(value) => {
                    form!.setFieldValue("enabled", value);
                    handleSave({ uuid: record.uuid, enabled: value });
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
      render: (_: any, record: ApiItem) => (
        <Button type="link" danger onClick={() => dispatch({ type: "remove", data: { uuid: record.uuid } })}>
          删除
        </Button>
      ),
    },
  ];
  const columns = defaultColumns.map((col) => {
    return {
      ...col,
      onCell: (record: ApiItem) => {
        return {
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: handleSave,
        };
      },
    };
  });
  return (
    <>
      <Card>
        <Flex gap="small">
          <NewRule onOk={(data) => dispatch({ type: "add", data })} />
          <Button type="primary">cURL</Button>
        </Flex>
        <Divider />
        <Table<ApiItem>
          bordered={false}
          rowKey="uuid"
          columns={columns as ColumnTypes}
          dataSource={dataSource}
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
