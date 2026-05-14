import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8">
                    <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-8 max-w-lg w-full flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
                        <pre className="text-xs text-white/60 bg-black/40 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                            {this.state.error.message}
                        </pre>
                        <button
                            onClick={() => this.setState({ error: null })}
                            className="self-start bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
