import {
  Button,
  Drawer,
  Flex,
  Form,
  FormInstance,
  FormListFieldData,
  Input,
  InputRef,
  Modal,
  Radio,
  Select,
} from "antd";
import { ApiItem } from "./interface";
import { ChangeEventHandler, useRef, useState } from "react";
import { curlToFetch } from "@/utils/curlToFetch";
import { NamePath } from "antd/es/form/interface";
import { atom } from "jotai";

enum MockType {
  JSON,
  JSON5,
  cURL,
  generate,
}

type MethodType = "GET" | "POST";

type RuleFormType = {
  path: string;
  method: MethodType;
  mock: {
    type: MockType;
    data: string;
    schema: MockObjectSchema[];
    json?: string;
    cURL?: string;
  };
};
type MockProps = Pick<RuleFormType, "mock">;
type SchemaProps = Pick<MockProps["mock"], "schema">;

interface MockObjectSchema {
  name: string;
  valueType: "string" | "number" | "boolean" | "object" | "array";
  attrs: MockObjectSchema[];
}

const jsonAtom = atom("");

function MockObjectSchemaBuilder(props: {
  root?: boolean;
  form: FormInstance<RuleFormType>;
  parentName: NamePath<RuleFormType>;
  field: FormListFieldData;
  add: (field: MockObjectSchema) => void;
  remove: (name: number) => void;
}) {
  const { root, parentName, field, add, remove, form } = props;
  const _parentName = Array.isArray(parentName) ? parentName : [parentName];
  const indent = root ? 0 : (_parentName.length - 2) * 8;
  const name = Form.useWatch(_parentName.concat("name"), form);
  const valueType = Form.useWatch(_parentName.concat("valueType"), form);

  return (
    <>
      <Flex gap={8} style={{ marginLeft: indent }}>
        <Form.Item name={[field.name, "name"]} rules={[{ required: true, message: "必填" }]}>
          <Input placeholder="字段名" />
        </Form.Item>
        <Form.Item name={[field.name, "valueType"]} rules={[{ required: true, message: "必填" }]}>
          <Select placeholder="类型">
            <Select.Option value="string">string</Select.Option>
            <Select.Option value="number">number</Select.Option>
            <Select.Option value="boolean">boolean</Select.Option>
            <Select.Option value="object">object</Select.Option>
            <Select.Option value="array">array</Select.Option>
          </Select>
        </Form.Item>
        {!!name && (valueType === "object" || valueType === "array") && (
          <>
            <Form.Item>
              <Button
                type="primary"
                onClick={() => {
                  const attrPath = _parentName.concat("attrs");
                  const attrs: Array<MockObjectSchema> = form.getFieldValue(attrPath as any);
                  form.setFieldValue(attrPath as any, attrs.concat([{ name: "", valueType: "string", attrs: [] }]));
                }}
              >
                添加属性
              </Button>
            </Form.Item>
          </>
        )}
        {!root && (
          <Form.Item>
            <Button danger type="primary" onClick={() => remove(field.name)}>
              删除属性
            </Button>
          </Form.Item>
        )}
      </Flex>
      <div style={{ marginLeft: indent + 4 }}>
        <Form.List name={[field.name, "attrs"]}>
          {(fields, { add, remove }) => {
            return fields.map((field) => {
              return (
                <MockObjectSchemaBuilder
                  key={field.key}
                  root={false}
                  form={form}
                  parentName={_parentName.concat(["attrs", field.name]) as any}
                  field={field}
                  add={add}
                  remove={remove}
                />
              );
            });
          }}
        </Form.List>
      </div>
    </>
  );
}

function MockObject(props: { form: FormInstance<RuleFormType> }) {
  const [form] = Form.useForm(props.form);
  const [creating, setCreating] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [schema, setSchema] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [json, setJson] = useState("");
  const create = () => {
    function _creator(schema: MockObjectSchema[]) {
      const result: Record<string, any> = {};
      for (const item of schema) {
        if (item.valueType === "object") {
          result[item.name] = _creator(item.attrs);
        } else if (item.valueType === "array") {
          result[item.name] = item.attrs.length ? [_creator(item.attrs)] : [];
        } else {
          result[item.name] =
            item.valueType === "string"
              ? Math.random().toString(36).slice(2)
              : item.valueType === "number"
              ? parseFloat(Math.random().toFixed(2))
              : Math.random() > 0.5;
        }
      }
      return result;
    }
    setCreating(true);
    form
      .validateFields()
      .then((values) => {
        const mockdata = _creator(values.mock.schema);
        setJson(JSON.stringify(mockdata, null, 2));
        setShowJson(true);
      })
      .finally(() => {
        setCreating(false);
      });
  };
  const displaySchema = () => {
    form.validateFields().then((schema) => {
      setSchema(JSON.stringify(schema, null, 2));
      setShowSchema(true);
    });
  };
  return (
    <>
      <Flex gap={4}>
        <Form.Item>
          <Button type="primary" onClick={create} loading={creating}>
            生成数据
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={displaySchema}>
            Schema
          </Button>
        </Form.Item>
      </Flex>
      <Form.List name={["mock", "schema"]}>
        {(fields, { add, remove }) => {
          return fields.map((field) => {
            return (
              <MockObjectSchemaBuilder
                key={field.key}
                root={true}
                form={form}
                parentName={["mock", "schema", field.name]}
                field={field}
                add={add}
                remove={remove}
              />
            );
          });
        }}
      </Form.List>
      <Drawer open={showJson} onClose={() => setShowJson(false)}>
        <pre>{json}</pre>
      </Drawer>
      <Drawer open={showSchema} onClose={() => setShowSchema(false)}>
        <pre>{schema}</pre>
      </Drawer>
    </>
  );
}

function Mock(props: {
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  form: FormInstance<RuleFormType>;
}) {
  const [form] = Form.useForm(props.form);
  const cURLRef = useRef<InputRef>(null);
  const [fetching, setFetching] = useState(false);
  const mockType = form.getFieldValue(["mock", "type"]);
  return (
    <>
      <Flex vertical>
        <Form.Item<RuleFormType> name={["mock", "type"]}>
          <Radio.Group>
            <Radio value={MockType.JSON}>JSON</Radio>
            <Radio value={MockType.JSON5}>JSON5</Radio>
            <Radio value={MockType.cURL}>cURL</Radio>
            <Radio value={MockType.generate}>生成</Radio>
          </Radio.Group>
        </Form.Item>
        {mockType === MockType.JSON || mockType === MockType.JSON5 ? (
          <Form.Item<RuleFormType> name={["mock", "json"]}>
            <Input.TextArea placeholder={mockType === MockType.JSON ? "JSON" : "JSON5"} autoSize={{ minRows: 4 }} />
          </Form.Item>
        ) : mockType === MockType.cURL ? (
          <Flex justify="space-between" className="gap-4">
            <Form.Item<RuleFormType> name={["mock", "cURL"]}>
              <Input placeholder="cURL" disabled={fetching} ref={cURLRef} />
            </Form.Item>
            <Button
              type="primary"
              loading={fetching}
              onClick={() => {
                setFetching(true);
                curlToFetch(cURLRef.current!.input!.value)
                  .then((res) => {
                    if (
                      res.headers.get("content-type")?.includes("application/json") ||
                      res.headers.get("content-type")?.includes("text/plain")
                    ) {
                      return res.text();
                    } else {
                      throw new Error("Not JSON");
                    }
                  })
                  .then((data) => {
                    try {
                      // @ts-ignore
                      props.onChange?.({ target: { value: JSON.parse(data) } });
                    } catch (error) {
                      // @ts-ignore
                      props.onChange({ target: { value: data } });
                    }
                  })
                  .finally(() => {
                    setFetching(false);
                  });
              }}
            >
              获取
            </Button>
          </Flex>
        ) : mockType === MockType.generate ? (
          <MockObject form={form} />
        ) : null}
      </Flex>
    </>
  );
}

export const NewRule = (props: { onOk: (data: ApiItem) => void }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RuleFormType>();
  const initialValues: Partial<RuleFormType> = {
    path: "",
    method: "GET",
    mock: {
      type: MockType.JSON,
      schema: [{ name: "", valueType: "string", attrs: [] }],
      data: "{}",
    },
  };
  const closeModalAndResetForm = () => {
    setOpen(false);
    form.resetFields();
  };
  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        添加规则
      </Button>
      <Modal
        title="添加规则"
        open={open}
        onCancel={closeModalAndResetForm}
        onOk={() => {
          form.validateFields().then((values) => {
            console.debug("%c[values]", "color: red;background:yellow", values);
            // props.onOk({ ...values, uuid: window.crypto.randomUUID(), enabled: false });
            // closeModalAndResetForm();
          });
        }}
      >
        <Form<RuleFormType> form={form} autoComplete="off" layout="vertical" initialValues={initialValues}>
          <Form.Item<RuleFormType> required name="path" label="path" rules={[{ required: true }]}>
            <Input placeholder="/api/example" />
          </Form.Item>
          <Form.Item<RuleFormType> required name="method" label="method" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item<RuleFormType> name="mock" label="Mock">
            <Mock form={form} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
