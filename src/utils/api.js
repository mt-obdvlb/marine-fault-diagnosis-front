import F from './F';

const api = {
    chatCompletions(body, arg = {}, opt = {}) {
        return F.myFetchApi('/v1/chat/completions', { toObj: false, ...arg }, { json: body, ...opt });
    },
    stopGeneration(body, arg = {}, opt = {}) {
        return F.myFetchApi('/v1/stop_generation', { expectCodes: [200], ...arg }, { json: body, ...opt });
    },

    kgOverview(arg = {}, opt = {}) {
        return F.myFetchApi('/api/kg/overview', { expectCodes: [200], ...arg }, opt);
    },
    kgSearch(query = {}, arg = {}, opt = {}) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params.set(key, value);
        });
        return F.myFetchApi(`/api/kg/search?${params.toString()}`, { expectCodes: [200], ...arg }, opt);
    },
    kgNode(nodeId, query = {}, arg = {}, opt = {}) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params.set(key, value);
        });
        const suffix = params.toString() ? `?${params.toString()}` : '';
        return F.myFetchApi(`/api/kg/node/${nodeId}${suffix}`, { expectCodes: [200], ...arg }, opt);
    },
    kgGraph(query = {}, arg = {}, opt = {}) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params.set(key, value);
        });
        return F.myFetchApi(`/api/kg/graph?${params.toString()}`, { expectCodes: [200], ...arg }, opt);
    },
    kgAddNode(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/kg/node', { expectCodes: [200, 201], ...arg }, { json: body, ...opt });
    },
    kgAddRelation(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/kg/relation', { expectCodes: [200, 201], ...arg }, { json: body, ...opt });
    },
    kgDeleteNode(nodeId, arg = {}, opt = {}) {
        return F.myFetchApi(`/api/kg/node/${nodeId}`, { expectCodes: [200], ...arg }, { method: 'DELETE', ...opt });
    },

    knowledgeList(query = {}, arg = {}, opt = {}) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params.set(key, value);
        });
        const suffix = params.toString() ? `?${params.toString()}` : '';
        return F.myFetchApi(`/api/knowledge/list${suffix}`, { expectCodes: [200], ...arg }, opt);
    },
    knowledgeAdd(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/knowledge/add', { expectCodes: [200, 201], ...arg }, { json: body, ...opt });
    },
    knowledgeImport(formData, arg = {}, opt = {}) {
        return F.myFetchApi('/api/knowledge/import', { expectCodes: [200, 201], ...arg }, { data: formData, ...opt });
    },
    knowledgeDelete(id, arg = {}, opt = {}) {
        return F.myFetchApi(`/api/knowledge/${id}`, { expectCodes: [200], ...arg }, { method: 'DELETE', ...opt });
    },
    knowledgeBuildIndex(arg = {}, opt = {}) {
        return F.myFetchApi('/api/knowledge/build_index', { expectCodes: [200], ...arg }, { method: 'POST', ...opt });
    },

    sessionAdd(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/session/add', { expectCodes: [200, 201], ...arg }, { json: body, ...opt });
    },
    sessionList(arg = {}, opt = {}) {
        return F.myFetchApi('/api/session/list', { expectCodes: [200], ...arg }, opt);
    },
    sessionRename(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/session/rename', { expectCodes: [200], ...arg }, { method: 'PUT', json: body, ...opt });
    },
    sessionDelete(sessionId, arg = {}, opt = {}) {
        return F.myFetchApi(`/api/session/delete/${sessionId}`, { expectCodes: [200], ...arg }, { method: 'DELETE', ...opt });
    },
    sessionClear(arg = {}, opt = {}) {
        return F.myFetchApi('/api/session/clear', { expectCodes: [200], ...arg }, { method: 'DELETE', ...opt });
    },

    qaList(sessionId, arg = {}, opt = {}) {
        return F.myFetchApi(`/api/qa/list?session_id=${encodeURIComponent(sessionId)}`, { expectCodes: [200], ...arg }, opt);
    },
    qaDelete(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/qa/delete', { expectCodes: [200], ...arg }, { method: 'DELETE', json: body, ...opt });
    },

    referenceGet(questionId, arg = {}, opt = {}) {
        return F.myFetchApi(`/api/reference/get?question_id=${encodeURIComponent(questionId)}`, { expectCodes: [200], ...arg }, opt);
    },
    referenceUpload(formData, arg = {}, opt = {}) {
        return F.myFetchApi('/api/reference/upload', { expectCodes: [200, 201], ...arg }, { data: formData, ...opt });
    },

    systemHealth(arg = {}, opt = {}) {
        return F.myFetchApi('/api/system/health', { expectCodes: [200], ...arg }, opt);
    },
    systemConfig(arg = {}, opt = {}) {
        return F.myFetchApi('/api/system/config', { expectCodes: [200], ...arg }, opt);
    },
    systemUpdateConfig(body, arg = {}, opt = {}) {
        return F.myFetchApi('/api/system/config', { expectCodes: [200], ...arg }, { method: 'PUT', json: body, ...opt });
    }
};

export default api;
