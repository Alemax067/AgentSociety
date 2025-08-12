import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, Flex, Col, Row, Alert, Popconfirm, Dropdown, Tabs, App } from 'antd';
import dayjs from 'dayjs';
import { Model, Survey as SurveyUI } from 'survey-react-ui';
import 'survey-core/defaultV2.min.css';
import { useForm } from 'antd/lib/form/Form';
import { ExportOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Editor } from '../../../components/Editor';
import { Survey } from '../../../components/type';
import { fetchCustom } from '../../../components/fetch';
import { useTranslation } from 'react-i18next';
import SurveyBuilder from './SurveyBuilder';

interface EditingSurvey {
    id: string;
    name: string;
    data: string;
}

const EmptySurvey: EditingSurvey = {
    id: '',
    name: '',
    data: JSON.stringify({
        pages: [
            {
                name: 'page1',
                elements: []
            }
        ]
    }, null, 2),
};

const SurveyTableInner = () => {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [open, setOpen] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<EditingSurvey>(EmptySurvey);
    const [form] = useForm();
    const [activeTab, setActiveTab] = useState('builder');
    const [formValues, setFormValues] = useState({ name: '', data: '' });

    useEffect(() => {
        if (editingSurvey) {
            const values = {
                name: editingSurvey.name,
                data: editingSurvey.data,
            };
            form.setFieldsValue(values);
            setFormValues(values);
        }
    }, [editingSurvey.id, editingSurvey.name, editingSurvey.data, form]);

    useEffect(() => {
        fetchSurveys();
    }, []);


    // const handleJsonButton = () => {
    //     window.open('https://surveyjs.io/create-free-survey', '_blank');
    // };


    const fetchSurveys = async () => {
        try {
            const res = await fetchCustom('/api/surveys');
            if (!res.ok) {
                const errMessage = await res.text();
                throw new Error(errMessage);
            }
            const data = await res.json();
            setSurveys(data.data);
        } catch (err) {
            message.error(`${t('survey.fetchFailed')} ${err}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetchCustom(`/api/surveys/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errMessage = await res.text();
                throw new Error(errMessage);
            }
            message.success(t('survey.deleteSuccess'));
            await fetchSurveys();
        } catch (err) {
            message.error(`${t('survey.deleteFailed')} ${err}`);
        }
    };

    const handleEdit = (survey) => {
        setEditingSurvey({
            id: survey.id,
            name: survey.name,
            data: JSON.stringify(survey.data, null, 2),
        });
        setOpen(true);
    };

    const handleCreate = () => {
        const newSurvey = {
            id: '',
            name: '',
            data: JSON.stringify({
                pages: [
                    {
                        name: 'page1',
                        elements: []
                    }
                ]
            }, null, 2),
        };
        setEditingSurvey(newSurvey);
        setActiveTab('builder');
        setOpen(true);
    };

    const handleSubmit = async (values) => {
        if (editingSurvey.id !== '') {
            try {
                const res = await fetchCustom(`/api/surveys/${editingSurvey.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: values.name,
                        data: JSON.parse(values.data),
                    }),
                });
                if (!res.ok) {
                    const errMessage = await res.text();
                    throw new Error(errMessage);
                }
                message.success(t('survey.updateSuccess'));
                setOpen(false);
                await fetchSurveys();
            } catch (err) {
                message.error(`${t('survey.updateFailed')} ${err}`);
            }
        } else {
            try {
                const res = await fetchCustom('/api/surveys', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: values.name,
                        data: JSON.parse(values.data),
                    }),
                });
                if (!res.ok) {
                    const errMessage = await res.text();
                    throw new Error(errMessage);
                }
                message.success(t('survey.createSuccess'));
                setOpen(false);
                await fetchSurveys();
            } catch (err) {
                message.error(`${t('survey.createFailed')} ${err}`);
            }
        }
    };

    const handleModalCancel = () => {
        setOpen(false);
    };

    const tableColumns = [
        { title: t('survey.table.id'), dataIndex: 'id', width: '13%' },
        { title: t('survey.table.name'), dataIndex: 'name', width: '7%' },
        {
            title: t('survey.table.data'),
            dataIndex: 'data',
            width: '55%',
            ellipsis: true,
            render: (text) => JSON.stringify(text, null, 2),
        },
        {
            title: t('survey.table.createdAt'),
            dataIndex: 'created_at',
            width: '10%',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: t('survey.table.updatedAt'),
            dataIndex: 'updated_at',
            width: '10%',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: t('survey.table.action'),
            key: 'action',
            width: '15%',
            render: (record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => handleEdit(record)}
                    >{t('survey.table.edit')}</Button>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'delete',
                                    label: (
                                        <Popconfirm
                                            title={t('survey.deleteConfirm')}
                                            onConfirm={() => handleDelete(record.id)}
                                        >
                                            <span style={{ color: '#ff4d4f' }}>{t('survey.table.delete')}</span>
                                        </Popconfirm>
                                    )
                                }
                            ]
                        }}
                    >
                        <Button icon={<EllipsisOutlined />} />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Flex vertical style={{ margin: "16px" }}>
                <Flex justify='end'>
                    <Button type="primary" onClick={handleCreate} style={{ marginBottom: 16 }}>
                        {t('survey.createSurvey')}
                    </Button>
                </Flex>
                <Table dataSource={surveys} columns={tableColumns} rowKey="id" />
                <Modal
                    open={open}
                    width='80vw'
                    title={editingSurvey.id ? t('survey.editSurvey') : t('survey.createSurvey')}
                    onCancel={handleModalCancel}
                    footer={null}
                >
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'builder',
                                label: t('survey.visualBuilder'),
                                children: (
                                    <Flex>
                                        <div style={{ width: '100%' }}>
                                            <Form
                                                form={form}
                                                layout="vertical"
                                                onValuesChange={(changedValues, allValues) => {
                                                    // 只在真正有变化时更新，避免无限循环
                                                    if (JSON.stringify(allValues) !== JSON.stringify(formValues)) {
                                                        setFormValues(allValues);
                                                    }
                                                }}
                                                onFinish={handleSubmit}
                                            >
                                                <Form.Item label={t('survey.surveyName')} name="name" rules={[
                                                    { required: true, message: t('survey.pleaseInputName') },
                                                ]}>
                                                    <Input />
                                                </Form.Item>
                                                {/* 隐藏的data字段，用于存储JSON数据 */}
                                                <Form.Item name="data" style={{ display: 'none' }}>
                                                    <Input type="hidden" />
                                                </Form.Item>
                                                <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
                                                    <SurveyBuilder
                                                        value={formValues.data || ''}
                                                        onChange={(value) => {
                                                            form.setFieldValue('data', value);
                                                            setFormValues(prev => ({ ...prev, data: value }));
                                                        }}
                                                    />
                                                </div>
                                                <Button type="primary" htmlType='submit' style={{ marginTop: 8 }}>
                                                    {t('survey.submit')}
                                                </Button>
                                            </Form>
                                        </div>
                                        {/* <div style={{ overflow: 'auto', maxHeight: '60vh', width: '50%' }}>
                                            <SurveyUI model={model} />
                                        </div> */}
                                    </Flex>
                                )
                            },
                            {
                                key: 'json',
                                label: t('survey.jsonEditor'),
                                children: (
                                    <Flex>
                        <Form
                            form={form}
                            style={{ width: '100%' }}
                            layout="vertical"
                            onValuesChange={(changedValues, allValues) => {
                                setEditingSurvey({
                                    ...editingSurvey,
                                    ...changedValues,
                                });
                            }}
                            onFinish={handleSubmit}
                        >
                            <Form.Item label={t('survey.surveyName')} name="name" rules={[
                                { required: true, message: t('survey.pleaseInputName') },
                            ]}>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label={<span>{t('survey.surveyJsonData')} {/* ({t('survey.onlineVisualEditor')}&nbsp;<ExportOutlined onClick={handleJsonButton} />&nbsp;) */}</span>}
                                name="data"
                                rules={[
                                    { required: true, message: t('survey.pleaseInputData') },
                                    {    
                                        validator: (_, value) => {
                                            try {
                                                JSON.parse(value);
                                                return Promise.resolve();
                                            } catch (e) {
                                                return Promise.reject(new Error(t('survey.invalidJson')));
                                            }
                                        }
                                    },
                                ]}
                            >
                                <Editor
                                    width="100%"
                                    height="50vh"
                                    language="json"
                                    defaultValue=''
                                    value={form.getFieldValue('data') || ''}
                                    onChange={(value) => form.setFieldValue('data', value)}
                                />
                            </Form.Item>
                            <Button type="primary" htmlType='submit' style={{ marginTop: 8 }}>
                                {t('survey.submit')}
                            </Button>
                        </Form>
                        {/* <div style={{ overflow: 'auto', maxHeight: '60vh', width: '50%' }}>
                            <SurveyUI model={model} />
                        </div> */}
                    </Flex>
                                )
                            }
                        ]}
                    />
                </Modal>
            </Flex>
        </>
    );
};

const SurveyTable = () => {
    return (
        <App>
            <SurveyTableInner />
        </App>
    );
};

export default SurveyTable;