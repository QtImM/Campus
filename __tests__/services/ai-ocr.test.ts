import { scanScheduleFromImage } from '../../services/ai-ocr';

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;
// Mock FormData
global.FormData = jest.fn(() => ({
    append: jest.fn(),
})) as any;

describe('AI OCR Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return extracted schedule data when fetch is successful', async () => {
        const mockApiResponse = {
            extraction: {
                course: 'Mathematics 101',
                room: 'Room A202',
                time: 'Mon 09:00 - 11:00'
            }
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockApiResponse)
        });

        const result = await scanScheduleFromImage('file://mock-image-path.jpg');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockApiResponse.extraction);
    });

    it('should return fallback data if extraction is not present but fetch is ok', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({})
        });

        const result = await scanScheduleFromImage('file://mock-image-path.jpg');

        expect(result).toEqual({
            course: '未能识别',
            room: '未能识别',
            time: '未能识别'
        });
    });

    it('should throw error when the AI backend responds with an error status', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(scanScheduleFromImage('file://mock-image-path.jpg'))
            .rejects
            .toThrow('AI Backend Error: 500');
    });
});
