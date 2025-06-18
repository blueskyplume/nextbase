"use client";
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Segmented, Modal, message } from 'antd';
import EntityList from '@/components/entity-list';
import { useTranslation } from '@/utils/i18n';
import { useRouter } from 'next/navigation';
import DatasetModal from './dataSetsModal';
import { ModalRef, UserProfile } from '@/types';
import { getName } from '@/utils/common';
import '@ant-design/v5-patch-for-react-19';
import { supabase } from '@/utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserInfoContext } from '@/context/userInfo';

const { confirm } = Modal;
import sideMenuStyle from './index.module.scss';

const DatasetManagePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useContext(UserInfoContext);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('anomaly');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const modalRef = useRef<ModalRef>(null);

  useEffect(() => {
    console.log(data);
    if (!loading) {
      getDataSets();
    }
  }, [activeTab]);

  const datasetTypes = [
    { key: 'anomaly', value: 'anomaly', label: t('datasets.anomaly') },
    { key: 'forecast', value: 'forecast', label: t('datasets.forecast') },
    { key: 'log', value: 'log', label: t('datasets.log') },
  ];

  const menuActions = (data: any) => [
    {
      key: 'edit',
      label: (
        <div>
          <span className="block w-full" onClick={() => handleOpenModal('edit', 'editform', data)}>{t('common.edit')}</span>
        </div>
      ),
    },
    {
      key: 'delete',
      label: (
        <div>
          <span className="block w-full" onClick={() => handleDelete(data)}>{t('common.delete')}</span>
        </div>
      ),
    },
  ];

  const getDataSets = async () => {
    setLoading(true);
    if (activeTab === 'anomaly') {
      const { data, error } = await supabase
        .from('anomaly_detection_datasets')
        .select(`*`);
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id,first_name,last_name');
      setUser(currentUser.user);
      if (data?.length) {
        const _data = data.map((item) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description || '--',
            icon: 'chakanshuji',
            creator: getName(item?.user_id, users),
            user_id: currentUser.user?.id,
            tenant_id: item.tenant_id
          }
        })
        setDatasets(_data);
      } else {
        message.error(`${error?.code} ${error?.message}`);
      }
    } else {
      setDatasets([]);
    }
    setLoading(false);
  };

  const infoText = (item: any) => {
    return `Created by: ${item.creator}`;
  };

  const navigateToNode = (item: any) => {
    router.push(
      `/dataset/manage/detail?folder_id=${item?.id}&folder_name=${item.name}&description=${item.description}`
    );
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchTerm('');
    setFilterValue([]);
  };

  const handleDelete = (data: any) => {
    confirm({
      title: t(`datasets.delDataset`),
      content: t(`datasets.delDatasetInfo`),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      centered: true,
      onOk() {
        return new Promise(async (resolve) => {
          try {
            const { error } = await supabase.from('anomaly_detection_datasets').delete().eq('id', data.id);
            if (error) {
              console.log(error);
              message.error('error');
            } else {
              message.success(t('common.successfullyDeleted'));
            }
          } finally {
            getDataSets();
            return resolve(true);
          }
        })
      }
    });
  };

  const handleOpenModal = (type: string, title: string, form: any = {}) => {
    modalRef.current?.showModal({ type, title, form });
  };

  return (
    <div className={`p-4`}>
      <div className={`flex flex-col w-full ${sideMenuStyle.segmented}`}>
        <Segmented
          options={datasetTypes.map((type) => ({
            label: type.label,
            value: type.key,
          }))}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>
      <EntityList
        data={datasets}
        loading={loading}
        onSearch={setSearchTerm}
        changeFilter={setFilterValue}
        // isSingleIconAction={false}
        menuActions={menuActions}
        openModal={() => handleOpenModal('add', 'addform')}
        infoText={infoText}
        onCardClick={(item) => {
          navigateToNode(item);
        }}
      />
      <DatasetModal
        ref={modalRef}
        supabase={supabase}
        user={user as User}
        options={datasetTypes}
        onSuccess={getDataSets}
      />
    </div>
  );
};

export default DatasetManagePage;
