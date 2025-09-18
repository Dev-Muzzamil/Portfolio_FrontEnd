# Integration Guide

## Quick Start

The new unified architecture is now ready for testing and integration. Here's how to get started:

### 1. Access the Test Suite

Navigate to the admin dashboard and click on "Architecture Test" in the sidebar. This will take you to `/admin/test` where you can:

- Run comprehensive tests on all services
- Test individual components
- View real-time test results
- See component demos in action

### 2. Try the Demo

Click on "Architecture Demo" in the sidebar to go to `/admin/demo`. This demonstrates:

- Real-world usage of the new services
- Document management integration
- Form management with validation
- API management with caching
- Unified component patterns

### 3. Test the Services

#### Document Management
```javascript
import { useDocumentManagement } from '../hooks/useDocumentManagement';

const MyComponent = () => {
  const {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    toggleVisibility
  } = useDocumentManagement('resume');

  // Use the hook methods
};
```

#### Form Management
```javascript
import { useFormManagement } from '../hooks/useFormManagement';

const MyComponent = () => {
  const {
    form,
    register,
    handleSubmit,
    isSubmitting,
    submitForm
  } = useFormManagement({
    defaultValues: {},
    apiEndpoint: '/api/items'
  });

  // Use the hook methods
};
```

#### API Management
```javascript
import { useApiManagement } from '../hooks/useApiManagement';

const MyComponent = () => {
  const {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: del
  } = useApiManagement({
    baseEndpoint: '/api/items'
  });

  // Use the hook methods
};
```

### 4. Use the Components

#### Document Manager
```javascript
import DocumentManager from '../components/common/DocumentManager';

<DocumentManager
  type="resume"
  documents={documents}
  onUpdate={handleUpdate}
  title="Resume Documents"
  showUpload={true}
  showEdit={true}
  showDelete={true}
  maxFiles={10}
/>
```

#### Expandable Card
```javascript
import ExpandableCard from '../components/common/ExpandableCard';

<ExpandableCard
  data={itemData}
  type="project"
  onEdit={handleEdit}
  onDelete={handleDelete}
  showActions={true}
  showExpandButton={true}
  showStatus={true}
/>
```

#### Modal System
```javascript
import ModalSystem, { ConfirmModal } from '../components/common/ModalSystem';

<ModalSystem
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</ModalSystem>
```

## Migration Steps

### 1. Gradual Migration

Start by using the new components in new features, then gradually migrate existing components:

1. **Phase 1**: Use new components in new features
2. **Phase 2**: Migrate simple components first
3. **Phase 3**: Migrate complex components
4. **Phase 4**: Remove old redundant code

### 2. Component Migration

#### Before (Old Pattern)
```javascript
const OldComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/upload', formData);
      setData([...data, response.data]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... more scattered logic
};
```

#### After (New Pattern)
```javascript
const NewComponent = () => {
  const {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument
  } = useDocumentManagement('resume');

  const handleUpload = async (file) => {
    await uploadDocument(file, { title: file.name });
  };

  // ... clean, focused logic
};
```

### 3. Service Integration

#### Document Service
```javascript
import { documentService } from '../services/DocumentService';

// Upload document
const result = await documentService.uploadDocument('resume', file, metadata);

// Delete document
const result = await documentService.deleteDocument('resume', documentId);

// Toggle visibility
const result = await documentService.toggleVisibility('resume', documentId, true);
```

#### API Service
```javascript
import { apiService } from '../services/ApiService';

// GET request
const result = await apiService.get('/api/items');

// POST request
const result = await apiService.post('/api/items', data);

// Upload with progress
const result = await apiService.upload('/api/upload', formData, onProgress);
```

## Testing

### 1. Run the Test Suite

1. Go to `/admin/test`
2. Click "Run All Tests"
3. Review the results
4. Check individual component tests

### 2. Test Individual Services

```javascript
import ArchitectureTestUtil from '../utils/architectureTest';

const testUtil = new ArchitectureTestUtil();
const results = await testUtil.testAllServices();
console.log(results);
```

### 3. Component Testing

Each component has built-in error handling and loading states. Test by:

1. Uploading files
2. Filling forms
3. Making API calls
4. Checking error states

## Performance Monitoring

### 1. Bundle Size

The new architecture reduces bundle size by:
- Eliminating duplicate code
- Using shared services
- Lazy loading components

### 2. Runtime Performance

Monitor improvements in:
- Reduced re-renders
- Faster API calls with caching
- Optimized file processing
- Better error handling

### 3. Developer Experience

Track improvements in:
- Code maintainability
- Development speed
- Bug reduction
- Team productivity

## Troubleshooting

### Common Issues

1. **Import Errors**: Check file paths and case sensitivity
2. **Hook Errors**: Ensure hooks are used inside React components
3. **Service Errors**: Check API endpoints and authentication
4. **Component Errors**: Verify prop types and required props

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

### Error Handling

All services include comprehensive error handling:
- Automatic retry for failed requests
- User-friendly error messages
- Graceful fallbacks
- Detailed logging

## Best Practices

### 1. Service Usage
- Always use the service layer for API calls
- Don't bypass services for direct API calls
- Use appropriate error handling
- Leverage caching when appropriate

### 2. Component Composition
- Use reusable components when possible
- Compose complex UIs from simple components
- Keep components focused and single-purpose
- Use proper prop validation

### 3. State Management
- Use custom hooks for shared state logic
- Keep local state minimal
- Use context for global state
- Avoid prop drilling

### 4. Error Handling
- Use consistent error patterns
- Provide user-friendly error messages
- Log errors for debugging
- Handle edge cases gracefully

## Support

For questions or issues:

1. Check the test suite results
2. Review the component demos
3. Check the console for errors
4. Refer to the architecture documentation

## Next Steps

1. **Test the new architecture** using the test suite
2. **Try the demo** to see real-world usage
3. **Start migrating** simple components
4. **Monitor performance** improvements
5. **Gather feedback** from the team

The new architecture provides a solid foundation for building maintainable, scalable React applications while significantly reducing code redundancy and improving the overall developer and user experience!
