import { useEffect } from 'react'
import { Save, X } from 'lucide-react'

// A reusable sticky action bar that stays fixed at the bottom
// Props:
// - show: boolean (controls visibility)
// - onSave: () => void
// - onCancel: () => void
// - isSaving?: boolean
// - saveLabel?: string (default: 'Save Changes')
// - cancelLabel?: string (default: 'Cancel')
// - shortcut?: boolean (default: true) // enables Ctrl/Cmd+S to save
const StickyActionBar = ({
	show,
	onSave,
	onCancel,
	isSaving = false,
	saveLabel = 'Save Changes',
	cancelLabel = 'Cancel',
	shortcut = true,
}) => {
	useEffect(() => {
		if (!shortcut || !show) return
		const handler = (e) => {
			const isMac = navigator.platform.toUpperCase().includes('MAC')
			if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault()
				onSave?.()
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [shortcut, show, onSave])

	if (!show) return null

	return (
		<div className="fixed inset-x-0 bottom-0 z-50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
				<div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
					<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
						Changes not applied until you save. Press Ctrl/Cmd+S to save quickly.
					</div>
					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={onCancel}
							className="btn-secondary flex items-center"
						>
							<X className="w-4 h-4 mr-2" />
							{cancelLabel}
						</button>
						<button
							onClick={onSave}
							disabled={isSaving}
							className="btn-primary flex items-center"
						>
							{isSaving ? (
								<div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<Save className="w-4 h-4 mr-2" />
							)}
							{saveLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default StickyActionBar

