import F from './F';

function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const text = params.toString();
  return text ? `?${text}` : '';
}

const api = {
  chatCompletions(body, arg = {}, opt = {}) {
    return F.myFetchApi('/v1/chat/completions', {toObj: false, ...arg}, {json: body, ...opt});
  },
  stopGeneration(body, arg = {}, opt = {}) {
    return F.myFetchApi('/stop_qa', {...arg}, {json: body, ...opt});
  },
  
  knowledgeList(query = {}, arg = {}, opt = {}) {
    const params = query?.keyword ? {keyword: query.keyword} : {};
    const userEndpoint = query?.keyword ? '/knowledge/query_user_knowledge' : '/knowledge/get_user_knowledges';
    const innerEndpoint = query?.keyword ? '/knowledge/query_inner_knowledge' : '/knowledge/get_inner_knowledges';
    const userReq = F.myFetchApi(`${userEndpoint}${buildQueryString(params)}`, {...arg}, opt);
    const innerReq = F.myFetchApi(`${innerEndpoint}${buildQueryString(params)}`, {...arg}, opt);
    
    return Promise.all([userReq, innerReq]).then(([userRes, innerRes]) => {
      if (!userRes && !innerRes) return userRes || innerRes;
      
      const userItems = Array.isArray(userRes?.data) ? userRes.data : [];
      const innerItems = Array.isArray(innerRes?.data) ? innerRes.data : [];
      const merged = [...userItems, ...innerItems];
      
      const page = Number(query?.page) > 0 ? Number(query.page) : 1;
      const pageSize = Number(query?.page_size) > 0 ? Number(query.page_size) : merged.length || 20;
      const start = (page - 1) * pageSize;
      const items = merged.slice(start, start + pageSize);
      
      const base = userRes || innerRes || {};
      return {
        ...base,
        code: base.code ?? 200,
        message: base.message || '操作成功',
        data: {
          total: merged.length,
          page,
          page_size: pageSize,
          items
        }
      };
    });
  },
  knowledgeAdd(body, arg = {}, opt = {}) {
    return F.myFetchApi('/api/knowledge/add', {...arg}, {json: body, ...opt});
  },
  knowledgeImport(formData, arg = {}, opt = {}) {
    return F.myFetchApi('/knowledge/upload_jsonl_knowledges', {...arg}, {data: formData, ...opt});
  },
  knowledgeDelete(payload, arg = {}, opt = {}) {
    const identifier = typeof payload === 'object' ? payload?.identifier : payload;
    const label = typeof payload === 'object' ? payload?.label : undefined;
    const query = buildQueryString({identifier, label});
    return F.myFetchApi(`/knowledge/del_knowledge${query}`, {...arg}, {method: 'DELETE', ...opt});
  },
  knowledgeBuildIndex(arg = {}, opt = {}) {
    return F.myFetchApi('/knowledge/build_index', {...arg}, {method: 'POST', ...opt});
  },
  
  sessionAdd(body, arg = {}, opt = {}) {
    return F.myFetchApi('/add_session', {...arg}, {json: body, ...opt});
  },
  sessionList(arg = {}, opt = {}) {
    return F.myFetchApi('/get_sessions', {...arg}, opt);
  },
  sessionRename(body, arg = {}, opt = {}) {
    return F.myFetchApi('/rename_session', {...arg}, {
      method: 'PUT',
      json: body, ...opt
    });
  },
  sessionDelete(sessionId, arg = {}, opt = {}) {
    return F.myFetchApi(`/delete_session/${sessionId}`, {...arg}, {method: 'DELETE', ...opt});
  },
  sessionClear(arg = {}, opt = {}) {
    return F.myFetchApi('/delete_all_sessions', {...arg}, {method: 'DELETE', ...opt});
  },
  
  qaList(sessionId, arg = {}, opt = {}) {
    return F.myFetchApi(`/get_qas?session_id=${encodeURIComponent(sessionId)}`, {...arg}, opt);
  },
  
  qaUpdate(body, arg = {}, opt = {}) {
    return F.myFetchApi('/update_qa', {...arg}, {
      method: 'PUT',
      json: body, ...opt
    });
  },
  qaDelete(body, arg = {}, opt = {}) {
    return F.myFetchApi('/delete_qa', {...arg}, {
      method: 'DELETE',
      json: body, ...opt
    });
  },
  
  referenceGet(questionId, arg = {}, opt = {}) {
    return F.myFetchApi(`/v1/reference_files?question_id=${encodeURIComponent(questionId)}`, {...arg}, opt).then((r) => {
      if (!r) return r;
      const payload = r.data && typeof r.data === 'object' ? r.data : r;
      const files = Array.isArray(payload.reference_files) ? payload.reference_files : [];
      const firstUrl = files[0]?.url || payload.html_url || payload.url || '';
      return {
        ...r,
        data: {
          html_url: firstUrl,
          html: typeof payload.html === 'string' ? payload.html : '',
          reference_files: files,
          knowledge_items: files.map((file) => ({
            name: file?.name || '',
            category: file?.type || ''
          }))
        }
      };
    });
  },
  
  systemConfig(arg = {}, opt = {}) {
    return F.myFetchApi('/config/llm', {...arg}, opt);
  },
  systemUpdateConfig(body, arg = {}, opt = {}) {
    return F.myFetchApi('/config/llm', {...arg}, {
      method: 'PUT',
      json: body, ...opt
    });
  }
};

export default api;
