import React, { createContext, useContext, useState } from "react";

interface AdminUsersContextValue {
    showCreateModal: boolean;
    openCreateModal: () => void;
    closeCreateModal: () => void;
}

const AdminUsersContext = createContext<AdminUsersContextValue>({
    showCreateModal: false,
    openCreateModal: () => { },
    closeCreateModal: () => { },
});

export const AdminUsersProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <AdminUsersContext.Provider
            value={{
                showCreateModal,
                openCreateModal: () => setShowCreateModal(true),
                closeCreateModal: () => setShowCreateModal(false),
            }}
        >
            {children}
        </AdminUsersContext.Provider>
    );
};

export const useAdminUsers = () => useContext(AdminUsersContext);
